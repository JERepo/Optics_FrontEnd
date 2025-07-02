// export const hasPermission = (access, module, action) => {
//   return !!access?.[module]?.permissions?.[action];
// };




export const hasPermission = (access, module, actions) => {
  if (!access?.[module]?.permissions) return false;

  // Handle array of actions
  if (Array.isArray(actions)) {
    return actions.some((action) => !!access[module].permissions[action]);
  }

  // Single action
  return !!access[module].permissions[actions];
};
