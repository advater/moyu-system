interface DBConfig {
  dbName: string;
  version: number;
  stores: {
    [key: string]: {
      keyPath: string;
      indexes?: Array<{
        name: string;
        keyPath: string;
        options?: IDBIndexParameters;
      }>;
    };
  };
}

class IndexDBManager {
  private db: IDBDatabase | null = null;
  private dbConfig: DBConfig;

  constructor(config: DBConfig) {
    this.dbConfig = config;
  }

  // 初始化数据库连接
  async initDB(): Promise<void> {
    if (this.db) return;

    return new Promise((resolve, reject) => {
      const request = indexedDB.open(
        this.dbConfig.dbName,
        this.dbConfig.version,
      );

      request.onerror = () => {
        reject(request.error);
      };

      request.onsuccess = () => {
        this.db = request.result;
        resolve();
      };

      request.onupgradeneeded = (event) => {
        const db = (event.target as IDBOpenDBRequest).result;

        // 创建对象仓库
        Object.entries(this.dbConfig.stores).forEach(([storeName, config]) => {
          if (!db.objectStoreNames.contains(storeName)) {
            const store = db.createObjectStore(storeName, {
              keyPath: config.keyPath,
            });

            // 创建索引
            config.indexes?.forEach((index) => {
              store.createIndex(index.name, index.keyPath, index.options);
            });
          }
        });
      };
    });
  }

  // 通用CRUD操作
  async add<T>(storeName: string, data: T): Promise<IDBValidKey> {
    return this.executeTransaction(storeName, "readwrite", (store) => {
      return store.add(data);
    });
  }

  async get<T>(storeName: string, key: IDBValidKey): Promise<T> {
    return this.executeTransaction(storeName, "readonly", (store) => {
      return store.get(key);
    });
  }

  async update<T>(storeName: string, data: T): Promise<IDBValidKey> {
    return this.executeTransaction(storeName, "readwrite", (store) => {
      return store.put(data);
    });
  }

  async delete(storeName: string, key: IDBValidKey): Promise<void> {
    return this.executeTransaction(storeName, "readwrite", (store) => {
      return store.delete(key);
    });
  }

  async getAll<T>(storeName: string): Promise<T[]> {
    return this.executeTransaction(storeName, "readonly", (store) => {
      return store.getAll();
    });
  }

  private executeTransaction<T>(
    storeName: string,
    mode: IDBTransactionMode,
    operation: (store: IDBObjectStore) => IDBRequest,
  ): Promise<T> {
    return new Promise((resolve, reject) => {
      if (!this.db) {
        reject(new Error("Database not initialized"));
        return;
      }

      const transaction = this.db.transaction(storeName, mode);
      const store = transaction.objectStore(storeName);
      const request = operation(store);

      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    });
  }
}

export default IndexDBManager;
