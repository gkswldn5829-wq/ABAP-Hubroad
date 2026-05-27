sap.ui.define([
    "sap/ui/core/mvc/Controller",
    "sap/ui/model/json/JSONModel"
], (Controller,JSONModel) => {
    "use strict";

    return Controller.extend("code.cl3.day6ui501.controller.Day6_ui5_01", {
        onInit() {

            let oData = {

                airlineSet : [
                    { Aircd: "AA", Airline: "American Airline", Url: "http/어쩌고/저쩌고", Curr:"USA" },
                    { Aircd: "KA", Airline: "Korean Airline", Url: "http/어쩌고/저쩌고2", Curr:"KOR" },
                    { Aircd: "LH", Airline: "Luft hanza", Url: "http/어쩌고/저쩌고3", Curr:"LHA" }
                ]
            };
            let oModel5 = new JSONModel(oData);

            this.getView().setModel(oModel5,"air");

            // Import JSOMModel from file
            var oModel = new JSONModel("/Data/ui5.json");
            // Set Json model
            this.getView().setModel(oModel,"file");

            let vModel = new JSONModel("/Data/ui5_02.json");
            let vModel2 = new JSONModel("/Data/ui5_03.json");
            this.getView().setModel(vModel,"live");
            this.getView().setModel(vModel2,"fail");

            // let oData = {
            //     labelSet : {
            //         text : "JSON Label",
            //         width : "100px",
            //         vAlign : "Bottom"
            //     },

            //     Inputset : {
            //         value : "JSON Article Title",
            //         holder : "JSON Place holder",
            //         width : "270px",
            //         desc : "JSON Description"
            //     },

            //     ButtonSet : {
            //         text : "Confirm",
            //         type : "Accept",
            //         press : "onClick()",
            //         icon : "sap-icon://check-availability"
            //     }
            // }
            // let oData2 = {

            //     panelSet : {
            //         header : "UI5 JSON header",
            //         width : "700px",
            //         height : "100px"
            //     }
            // }


            // let W, W2
            //     W=new JSONModel(oData);
            //     W2=new JSONModel(oData2);
            //     this.getView().setModel(W);
            //     this.getView().setModel(W2,"chat");
        },
        onArray(){

            let lt_data = [
                { Id : "Alpha", Pw : "12345" },
                { Id : "Bravo", Pw : "abcde" },
                { Id : "Charlie", Pw: "qwert" }
            ];
                for(let i=0; i<lt_data.length;i++){
                    console.log("ID : "+lt_data[i].Id);
                    console.log("PW : "+lt_data[i].Pw);
                }
                for(let k in lt_data){
                    console.log(k);
                }
                for(let j in lt_data){
                    console.log(lt_data[j]);
                }
        }

    });
});