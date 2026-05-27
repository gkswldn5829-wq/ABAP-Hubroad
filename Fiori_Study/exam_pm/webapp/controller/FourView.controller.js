sap.ui.define([
    "sap/ui/core/mvc/Controller",
    "sap/ui/model/json/JSONModel",
    "sap/ui/model/Filter",
	"sap/ui/model/FilterOperator"
], (Controller,JSONModel,Filter,FilterOperator) => {
    "use strict";

    return Controller.extend("code.cl3.exampm.controller.FourView", {
        onInit() {   
        },
        goFirst(){
            this.getOwnerComponent().getRouter().navTo("Routeexam_pm") //4번째 사이트인 현재에서 처음 사이트로 갈 수 있도록 하는 코드 , But oRouter라는 변수로 따로 저장하지 않고 이어서 사용
        }
    });
});