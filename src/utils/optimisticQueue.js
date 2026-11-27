import { toRaw } from 'vue'

const isPlainObject = (v) => v !== null && typeof v === 'object' && !Array.isArray(v) && !(v instanceof Date)

export function unwrap(value) {
  if (value === null || typeof value !== 'object') return value
  const raw = toRaw(value)
  if (Array.isArray(raw)) return raw.map(unwrap)
  if (raw instanceof Date) return new Date(raw.getTime())
  const out = {}
  for (const [k, v] of Object.entries(raw)) out[k] = unwrap(v)
  return out
}

export function deepMerge(target, patch) {
  for (const [k, v] of Object.entries(patch)) {
    if (isPlainObject(v) && isPlainObject(target[k])) {
      deepMerge(target[k], v)
    } else {
      target[k] = unwrap(v)
    }
  }
  return target
}

function mergeMissing(base, snap) {
  for (const [k, v] of Object.entries(snap)) {
    if (!(k in base)) {
      base[k] = v
    } else if (isPlainObject(v) && isPlainObject(base[k])) {
      mergeMissing(base[k], v)
    }
  }
}

export function restoreFields(target, snap) {
  for (const [k, v] of Object.entries(snap)) {
    if (v === undefined) delete target[k]
    else if (isPlainObject(v) && isPlainObject(target[k])) restoreFields(target[k], v)
    else target[k] = unwrap(v)
  }
}

export function snapshotFields(obj, patch) {
  const out = {}
  for (const [k, v] of Object.entries(patch)) {
    if (isPlainObject(v) && isPlainObject(obj?.[k])) {
      out[k] = snapshotFields(obj[k], v)
    } else {
      out[k] = obj?.[k] === undefined ? undefined : unwrap(obj[k])
    }
  }
  return out
}

/**
 * Fila padronizada de mutações otimistas com coalescing e versionamento por chave:
 * - Aplica no estado local imediatamente (0ms na UI).
 * - Cliques/arrastos rápidos na mesma entidade são mesclados no próximo PATCH sequencial.
 * - Respostas atrasadas nunca sobrescrevem o estado otimista mais recente.
 * - Rollback restaura exatamente o último estado confirmado no servidor caso a última versão falhe.
 */
export function createOptimisticQueue() {
  const versions = new Map()
  const pending = new Map()
  const inFlight = new Map()
  const bases = new Map()

  function enqueue(key, { patch, deep = false, apply, captureBefore, revert, send, onSuccess, onError }) {
    const cleanPatch = unwrap(patch)
    const ver = (versions.get(key) || 0) + 1
    versions.set(key, ver)

    if (captureBefore) {
      const snap = captureBefore(cleanPatch)
      if (snap) {
        if (bases.has(key)) mergeMissing(bases.get(key), snap)
        else bases.set(key, snap)
      }
    }

    apply(cleanPatch)

    if (pending.has(key)) {
      if (deep) deepMerge(pending.get(key), cleanPatch)
      else Object.assign(pending.get(key), cleanPatch)
    } else {
      pending.set(key, unwrap(cleanPatch))
    }

    if (inFlight.has(key)) return inFlight.get(key)

    const flush = (async () => {
      let lastResult = true
      while (pending.has(key)) {
        const batch = pending.get(key)
        pending.delete(key)
        const sentVer = versions.get(key)
        try {
          const res = await send(batch)
          if (bases.has(key)) {
            if (deep) deepMerge(bases.get(key), batch)
            else Object.assign(bases.get(key), unwrap(batch))
          }
          const isLatest = versions.get(key) === sentVer && !pending.has(key)
          if (isLatest && onSuccess) onSuccess(res)
          lastResult = true
        } catch (e) {
          const isLatest = versions.get(key) === sentVer && !pending.has(key)
          if (isLatest && revert && bases.has(key)) revert(bases.get(key))
          if (onError) onError(e)
          lastResult = e.message || false
        }
      }
      return lastResult
    })().finally(() => {
      inFlight.delete(key)
      if (!pending.has(key)) bases.delete(key)
    })

    inFlight.set(key, flush)
    return flush
  }

  function clear() {
    versions.clear()
    pending.clear()
    inFlight.clear()
    bases.clear()
  }

  return { enqueue, clear }
}
