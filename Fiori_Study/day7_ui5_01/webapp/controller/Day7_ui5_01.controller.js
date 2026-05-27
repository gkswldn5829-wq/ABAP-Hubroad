let gv_calcul = '',gv_result = '';
sap.ui.define([
    "sap/ui/core/mvc/Controller",
    "sap/ui/model/json/JSONModel"
], (Controller,JSONModel) => {
    "use strict";

    return Controller.extend("code.cl3.day7ui501.controller.Day7_ui5_01", {
        onInit() {
            let J, S2
            J = new JSONModel("/제이슨/test.json");
            this.getView().setModel(J,"server1");

        },
     
        setNumber(val) {

            if(val == ''){
                gv_calcul = '';
                gv_result = '';
                this.getView().byId("input").setValue("");
                return;
            };

            switch (val) {
                case 'eq':
                    gv_result = eval(gv_calcul);
                    this.getView().byId("input").setValue(gv_result);
                    break;
            
                default:
                    gv_calcul += val;
                    this.getView().byId("input").setValue(gv_calcul);
                    break;
            }
                        
        }
        // onEqualsPress(){
        //     let result

            
        //     result = eval(input)
        //     this.getView().byId("livetext").setValue(result);
        // }
        
    });
});