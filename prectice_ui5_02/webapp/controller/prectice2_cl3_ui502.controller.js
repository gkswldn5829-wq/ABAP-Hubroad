sap.ui.define([
    "sap/ui/core/mvc/Controller",
    "sap/ui/model/Filter",
	"sap/ui/model/FilterOperator"
], (Controller,Filter,FilterOperator) => {
    "use strict";

    return Controller.extend("codecl3.preticeui502.controller.prectice2_cl3_ui502", {
        onInit() {
        },
        onSearch(){
            let input1, input2, array=[];
            input1 = this.getView().byId("word").getValue();
            input2 = this.getView().byId("word2").getValue();
            
            if(input1!==''){
                array.push(new Filter("Carrid",FilterOperator.Contains,input1));
            }
            if(input2!==''){
                array.push(new Filter("Connid",FilterOperator.EQ,input2));
            }
            if(array.length>=0){
                this.getView().byId("second").getBinding("rows").filter(array);
            }
        }
    });
});