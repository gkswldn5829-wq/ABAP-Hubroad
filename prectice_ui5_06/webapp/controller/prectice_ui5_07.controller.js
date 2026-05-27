sap.ui.define([
    "sap/ui/core/mvc/Controller"
], (Controller) => {
    "use strict";

    return Controller.extend("code.cl3.precticeui506.controller.prectice_ui5_07", {
        onInit() {
        },
  
        NextSet(){
            
            //인풋 값 컨트롤러에 받아오기
            var vCarrid = this.getView().byId("Carrid").getValue();
            var vConnid = this.getView().byId("Connid").getValue();

            //Navi to receiver with parameter

            var oRouter = this.getOwnerComponent().getRouter();
            oRouter.navTo("Routeprectice_ui5_08",{Carrid:vCarrid,Connid:vConnid});
            this.getOwnerComponent().getRouter().navTo("Routeprectice_ui5_08");
        }
    });
});