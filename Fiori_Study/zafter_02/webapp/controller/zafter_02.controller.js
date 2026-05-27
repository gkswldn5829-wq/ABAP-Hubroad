sap.ui.define([
    "sap/ui/core/mvc/Controller",
    "sap/ui/model/Filter",
	"sap/ui/model/FilterOperator"
], (Controller,Filter,FilterOperator) => {
    "use strict";

    return Controller.extend("cl327.zafter02.controller.zafter_02", {
        onInit() {
        },
        onSearch(){
            let input1,input2,input3,array=[];
            input1 = this.getView().byId("word").getValue();
            input2 = this.getView().byId("word2").getValue();
            input3 = this.getView().byId("word3").getValue();

            if(input1!==''){
                array.push(new Filter("Bukrs",FilterOperator.Contains,input1));
            }
            if(input2!==''){
                array.push(new Filter("Wrbtr",FilterOperator.Contains,input2));
            }
            if(input3!==''){
                array.push(new Filter("Gjahr",FilterOperator.EQ,input3));
            }
            if(array.length>=0){
                this.getView().byId("Table").getBinding("rows").filter(array);
            }
        },
        filterGlobally(E){
            let array2 = [];
            let B = E.getParameter("query");
            if(B){
                array2.push(new Filter("Buzei", FilterOperator.EQ,B));
            }
            this.getView().byId("Table").getBinding("rows").filter(array2);
        },
        
    });
});