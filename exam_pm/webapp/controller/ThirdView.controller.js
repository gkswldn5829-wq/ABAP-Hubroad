sap.ui.define([
    "sap/ui/core/mvc/Controller",
    "sap/ui/model/json/JSONModel",
    "sap/ui/model/Filter",
	"sap/ui/model/FilterOperator"
], (Controller,JSONModel,Filter,FilterOperator) => {
    "use strict";

    return Controller.extend("code.cl3.exampm.controller.ThirdView", {
        onInit() {   
        },
        goFour(){
            this.getOwnerComponent().getRouter().navTo("RouteFourView") //4번째 사이트로 갈 수 있는 코드 + 경로
        }
    });
});