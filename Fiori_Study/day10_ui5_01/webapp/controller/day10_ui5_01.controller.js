sap.ui.define([
    "sap/ui/core/mvc/Controller",
    "sap/ui/model/json/JSONModel",
    "sap/ui/model/Filter",
	"sap/ui/model/FilterOperator"
], (Controller,JSONModel,Filter,FilterOperator) => {
    "use strict";

    return Controller.extend("code.cl3.day10ui501.controller.day10_ui5_01", {
        onInit() {
            let oData = {
            kostlSet : [
                
                { kost :  "ks001", ktext: "guroCenter", kstar : "700986934" },
                { kost :  "ks002", ktext: "jongroCenter", kstar : "809869342" },
                { kost :  "ks003", ktext: "SongpaCenter", kstar : "7009863213" },
                { kost :  "ks004", ktext: "GangnamCenter", kstar : "4643634524" },
                { kost :  "ks005", ktext: "SeochoCenter", kstar : "7009823423" },
                { kost :  "ks006", ktext: "guroCenter", kstar : "700981321315" }

            ]
            }
            let model
            model= new JSONModel(oData)
            this.getView().setModel(model,"server1");

        },

        onSearch(){
            let input1, input2, array=[]
            input1 = this.getView().byId("word").getValue();
            input2 = this.getView().byId("word2").getValue();
            
            if(input1!==''){
                array.push(new Filter("kost",FilterOperator.Contains,input1));
            }
            if(input2!==''){
                array.push(new Filter("ktext",FilterOperator.Contains,input2));
            }
            if(array.length>=0){
                this.getView().byId("table").getBinding("rows").filter(array);
            }
            console.log("onSearch");
        },

        filterGlobally(E){
            let array = [];
            let B = E.getParameter("query");
            if(B){
                array.push(new Filter("kstar", FilterOperator.Contains, B));
            }
            this.getView().byId("table").getBinding("rows").filter(array);

            console.log("filterGlobally");
        }
        
    });
});