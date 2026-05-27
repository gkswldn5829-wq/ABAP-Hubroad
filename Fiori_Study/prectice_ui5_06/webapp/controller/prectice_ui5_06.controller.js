sap.ui.define([
    "sap/ui/core/mvc/Controller"
], (Controller) => {
    "use strict";

    return Controller.extend("code.cl3.precticeui506.controller.prectice_ui5_06", {
        onInit() {
        },
        goSecond(){
            const oRouter = this.getOwnerComponent().getRouter(); 
			oRouter.navTo("Routeprectice_ui5_07");
        }
    });
});