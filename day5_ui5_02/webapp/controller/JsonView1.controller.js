sap.ui.define([
    "sap/ui/core/mvc/Controller",
    "sap/ui/model/json/JSONModel",
    "sap/m/MessageToast"
], (Controller,JSONModel,MessageToast) => {
    "use strict";

    return Controller.extend("code.cl3.dayui502.controller.JsonView1", {
        onInit() {
            //Json 모델 변수
            let oData = { 
                InputSet : { 
                    aaa : "Json Value",
                    holder : "Json placeholder",
                    width : "200px",
                    dec : "부가설명"
                },

                Buttonset:{
                    text : "Json text",
                    text2 : "Accept",
                    icon : "sap-icon://accessibility"
                },

                Test : {
                    aa : "UI5패널",
                    wi : "300px",
                    he : "200px",
                    pp : "Production Plan",
                    des : "PP모듈",
                    wit : "400px",
                    con : "Controling",
                    dec : "CO모듈",
                    hm : "Human Resource",
                    hr : "HR모듈"
                }

            }

            let oData2 ={

                Test : {
                    aa : "UI5패널",
                    wi : "300px",
                    he : "200px",
                    pp : "Production Plan",
                    des : "PP모듈",
                    wit : "400px",
                    con : "Controling",
                    dec : "CO모듈",
                    hm : "Human Resource",
                    hr : "HR모듈"
                }
                
            };
            
            let model = new JSONModel(oData); //데이터를 JSONModel 생산자로 감싸서 모델 변수에 넣음
            let model2 = new JSONModel(oData2); //2번째 변수 oData를 사용한다고 가정 

            this.getView().setModel(model); //변수 모델을 셋모델로 뷰쪽으로 넘겨줌
            this.getView().setModel(model2,"panel"); //모델을 2개 사용하고 싶을 때 콤마로 모델명을 선언해주면 구분이 가능하다.
        },
        
    });
});