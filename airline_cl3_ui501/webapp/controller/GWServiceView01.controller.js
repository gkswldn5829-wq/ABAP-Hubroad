sap.ui.define([
    "sap/ui/core/mvc/Controller",
    "sap/ui/model/Filter",
	"sap/ui/model/FilterOperator"
], (Controller,Filter,FilterOperator) => {
    "use strict";

    return Controller.extend("code.cl3.airlinecl3ui501.controller.GWServiceView01", {
        onInit() {
        },
        onSearch(E){
            let array = [];
            let query = E.getParameter("query");
            if(query){
                array.push(new Filter("Carrid", FilterOperator.Contains, query));
            }
            this.getView().byId("airline").getBinding("rows").filter(array);
        }

    });
});