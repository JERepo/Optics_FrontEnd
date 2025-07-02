import React from "react";
import HasAccess from "../../components/HasPermission";
import { ROLES } from "../../utils/constants/roles";
import { useSelector } from "react-redux";

const AdminDashboard = () => {
  const user = useSelector(state => state.auth.user);
  console.log(user)
  return (
    <div>
      
    </div>
  );
};

export default AdminDashboard;

// import { useSelector } from "react-redux";
// import { ROLES } from "../../utils/constants/roles";
// import { hasAccess } from "../../utils/hasAccess";

// const AdminDashboard = () => {
//   const userTypeId = useSelector((state) => state.auth.userTypeId);

//   if (!hasAccess(userTypeId, [ROLES.ADMIN, ROLES.EDITOR])) {
//     return <p>Access Denied</p>;
//   }

//   return <div>Welcome to AdminDashboard</div>;
// };

// export default AdminDashboard;
