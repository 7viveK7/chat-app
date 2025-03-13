"use client"

import { useState, useEffect, useCallback } from "react"

const DB_NAME = "chat-app-db"
const DB_VERSION = 1

export function useIndexedDB(storeName: string) {
  const [db, setDb] = useState<IDBDatabase | null>(null)
  const [error, setError] = useState<Error | null>(null)

  useEffect(() => {
    if (typeof window === "undefined") return

    const request = indexedDB.open(DB_NAME, DB_VERSION)

    request.onerror = (event) => {
      setError(new Error("IndexedDB error"))
      console.error("IndexedDB error:", event)
    }

    request.onsuccess = (event) => {
      const db = (event.target as IDBOpenDBRequest).result
      setDb(db)
    }

    request.onupgradeneeded = (event) => {
      const db = (event.target as IDBOpenDBRequest).result

      // Create object stores if they don't exist
      if (!db.objectStoreNames.contains(storeName)) {
        db.createObjectStore(storeName, { keyPath: "id" })
      }
    }

    return () => {
      if (db) {
        db.close()
      }
    }
  }, [storeName])

  const getItem = useCallback(
    (id: string): Promise<any> => {
      return new Promise((resolve, reject) => {
        if (!db) {
          reject(new Error("Database not initialized"))
          return
        }

        const transaction = db.transaction(storeName, "readonly")
        const store = transaction.objectStore(storeName)
        const request = store.get(id)

        request.onsuccess = () => {
          resolve(request.result)
        }

        request.onerror = () => {
          reject(request.error)
        }
      })
    },
    [db, storeName],
  )

  const setItem = useCallback(
    (id: string, value: any): Promise<void> => {
      return new Promise((resolve, reject) => {
        if (!db) {
          reject(new Error("Database not initialized"))
          return
        }

        const transaction = db.transaction(storeName, "readwrite")
        const store = transaction.objectStore(storeName)
        const request = store.put(value)

        request.onsuccess = () => {
          resolve()
        }

        request.onerror = () => {
          reject(request.error)
        }
      })
    },
    [db, storeName],
  )

  const removeItem = useCallback(
    (id: string): Promise<void> => {
      return new Promise((resolve, reject) => {
        if (!db) {
          reject(new Error("Database not initialized"))
          return
        }

        const transaction = db.transaction(storeName, "readwrite")
        const store = transaction.objectStore(storeName)
        const request = store.delete(id)

        request.onsuccess = () => {
          resolve()
        }

        request.onerror = () => {
          reject(request.error)
        }
      })
    },
    [db, storeName],
  )

  const getAllItems = useCallback((): Promise<any[]> => {
    return new Promise((resolve, reject) => {
      if (!db) {
        reject(new Error("Database not initialized"))
        return
      }

      const transaction = db.transaction(storeName, "readonly")
      const store = transaction.objectStore(storeName)
      const request = store.getAll()

      request.onsuccess = () => {
        resolve(request.result)
      }

      request.onerror = () => {
        reject(request.error)
      }
    })
  }, [db, storeName])

  return {
    getItem,
    setItem,
    removeItem,
    getAllItems,
    error,
  }
}

