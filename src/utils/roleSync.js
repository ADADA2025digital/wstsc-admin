// src/utils/roleSync.js
export const syncUserRole = (profile) => {
  return new Promise((resolve) => {
    console.log("🔄 syncUserRole: Starting role synchronization for", profile.role_name);
    
    // Get current user data from localStorage
    const currentUserData = JSON.parse(localStorage.getItem("userData") || "{}");
    
    console.log("📊 syncUserRole: Current data BEFORE update:", currentUserData.primary_role);
    
    // Create the updated role object
    const updatedRole = {
      role_name: profile.role_name,
      display_name: profile.role,
      roleid: profile.id || profile.roleid
    };
    
    console.log("📊 syncUserRole: New role to set:", updatedRole);
    
    // Update ONLY the role, keep all other data
    const updatedUserData = {
      ...currentUserData,
      primary_role: updatedRole
    };
    
    console.log("📊 syncUserRole: Updated data AFTER role change:", updatedUserData.primary_role);
    
    // Save to localStorage - THIS IS CRITICAL
    localStorage.setItem("userData", JSON.stringify(updatedUserData));
    console.log("✅ syncUserRole: Role synchronized successfully to localStorage");
    
    // Double verify it was saved
    const verifySave = JSON.parse(localStorage.getItem("userData"));
    console.log("🔍 syncUserRole: Verification - localStorage NOW contains:", verifySave.primary_role);
    
    // Wait to ensure write is complete
    setTimeout(() => {
      resolve(updatedUserData);
    }, 300);
  });
};

export const verifyRoleSync = () => {
  const userData = localStorage.getItem("userData");
  console.log("🔍 verifyRoleSync: Current localStorage userData:", userData);
  if (userData) {
    const parsed = JSON.parse(userData);
    console.log("🔍 verifyRoleSync: Parsed role:", parsed?.primary_role);
    return parsed;
  }
  return null;
};

export const shouldRefreshFromAPI = () => {
  const userData = localStorage.getItem("userData");
  const roleSwitchComplete = localStorage.getItem("roleSwitchComplete");
  const lastRoleSwitch = localStorage.getItem("lastRoleSwitch");
  
  console.log("🔍 shouldRefreshFromAPI check:");
  console.log("  - userData exists:", !!userData);
  console.log("  - roleSwitchComplete:", roleSwitchComplete);
  console.log("  - lastRoleSwitch:", lastRoleSwitch);
  
  // If we just switched roles, don't refresh from API
  if (roleSwitchComplete === "true" && lastRoleSwitch) {
    const switchTime = new Date(lastRoleSwitch);
    const currentTime = new Date();
    const timeDiff = currentTime - switchTime;
    const minutesDiff = timeDiff / (1000 * 60);
    
    // Don't refresh from API for 5 minutes after role switch
    if (minutesDiff < 5) {
      console.log("🔄 Recently switched roles, skipping API refresh");
      return false;
    }
  }
  
  // Only refresh from API if we don't have user data
  return !userData;
};