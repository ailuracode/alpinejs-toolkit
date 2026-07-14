declare global {
  namespace Alpine {
    interface Stores {
      permissions: import("./types.js").PermissionsStore;
    }

    interface Magics<T> {
      $permissions: import("./types.js").PermissionsMagic;
    }
  }
}

export {};
