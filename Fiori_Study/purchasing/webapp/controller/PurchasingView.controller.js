sap.ui.define([
    "sap/ui/core/mvc/Controller",
    "sap/ui/model/odata/v2/ODataModel",
    "sap/ui/model/Filter",
	"sap/ui/model/FilterOperator"
], (Controller, ODataModel,Filter,FilterOperator) => {
    "use strict";

    return Controller.extend("cl3.jiwoo.purchasing.controller.PurchasingView", {
        onInit() {
            var oModel = new ODataModel("/sap/opu/odata/sap/ZCL3_27_21_DDL_CDS/");
            this.getView().setModel(oModel, "Chart");
        },
        onSearch(){
            let input1, input2, array=[]
            input1 = this.getView().byId("word").getValue();
            input2 = this.getView().byId("word2").getValue();
            
            if(input1!==''){
                array.push(new Filter("ebeln",FilterOperator.Contains,input1));
            }
            if(input2!==''){
                array.push(new Filter("bukrs",FilterOperator.Contains,input2));
            }
            if(array.length>=0){
                this.getView().byId("Table").getBinding("rows").filter(array);
            }
            console.log("onSearch");
        },
        filterGlobally(E){
            let array = [];
            let B = E.getParameter("query");
            if(B){
                array.push(new Filter("ebeln", FilterOperator.Contains, B));
            }
            this.getView().byId("Table").getBinding("rows").filter(array);

            console.log("filterGlobally");
        }
    });
});