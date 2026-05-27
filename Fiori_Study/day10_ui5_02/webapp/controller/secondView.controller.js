sap.ui.define([
    "sap/ui/core/mvc/Controller"
], (Controller) => {
    "use strict";

    return Controller.extend("code.cl3.day10ui502.controller.secondView", {
        onInit() {
        },

        goFirst(){
            this.getOwnerComponent().getRouter().navTo("Routeday10_ui5_02");
			
        },
        goThird(){
            
            const oRouter = this.getOwnerComponent().getRouter();
			oRouter.navTo("detail");


            this.getOwnerComponent().getRouter().navTo("detail");
        }
        
    });
});