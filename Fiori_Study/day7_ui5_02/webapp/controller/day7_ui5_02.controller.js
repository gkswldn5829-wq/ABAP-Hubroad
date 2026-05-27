sap.ui.define([
    "sap/ui/core/mvc/Controller",
    "sap/ui/model/json/JSONModel",
    "sap/m/MessageToast"
], (Controller, JSONModel, MessageToast) => {
    "use strict";

    // 🚨 중요: 'YOUR_CONTROLLER_PATH'를 실제 컨트롤러 경로로 수정하세요.
    return Controller.extend("code.cl3.day7ui501.controller.Day7_ui5_01", { 
        
        onInit() {
            // 계산기 상태를 관리하는 JSON 모델 초기화
            let oModel = new JSONModel({
                display: "0",       
                currentValue: null, 
                operator: null,     
                isNewEntry: true    
            });
            this.getView().setModel(oModel, "calcModel");
        },

        onCalcPress(oEvent) {
            const sValue = oEvent.getSource().data("val"); 
            const oModel = this.getView().getModel("calcModel");
            let sDisplay = oModel.getProperty("/display");
            
            // 1. 숫자 또는 소수점 입력 처리 (0-9, .)
            if (!isNaN(sValue) || sValue === '.') {
                if (oModel.getProperty("/isNewEntry") || sDisplay === "0") {
                    sDisplay = (sValue === '.') ? "0." : sValue;
                } else if (sValue === '.' && sDisplay.includes('.')) {
                    return; 
                } else {
                    sDisplay += sValue;
                }
                oModel.setProperty("/display", sDisplay);
                oModel.setProperty("/isNewEntry", false);
            
            // 2. 연산자 입력 처리 (+, -, *, /)
            } else if (sValue === '+' || sValue === '-' || sValue === '*' || sValue === '/') {
                if (oModel.getProperty("/operator") && !oModel.getProperty("/isNewEntry")) {
                    this._calculate(); 
                }
                oModel.setProperty("/currentValue", parseFloat(oModel.getProperty("/display")));
                oModel.setProperty("/operator", sValue);
                oModel.setProperty("/isNewEntry", true); 

            // 3. 결과 (=) 처리
            } else if (sValue === '=') {
                if (oModel.getProperty("/operator") && !oModel.getProperty("/isNewEntry")) {
                    this._calculate();
                    oModel.setProperty("/operator", null);
                    oModel.setProperty("/isNewEntry", true);
                }
            
            // 4. 클리어 (C) 처리
            } else if (sValue === 'C') {
                oModel.setData({
                    display: "0",
                    currentValue: null,
                    operator: null,
                    isNewEntry: true
                });
            }
        },

        _calculate() {
            const oModel = this.getView().getModel("calcModel");
            const fVal1 = oModel.getProperty("/currentValue");
            const fVal2 = parseFloat(oModel.getProperty("/display"));
            const sOp = oModel.getProperty("/operator");
            let fResult;

            if (fVal1 === null || sOp === null) return; 

            switch (sOp) {
                case '+': fResult = fVal1 + fVal2; break;
                case '-': fResult = fVal1 - fVal2; break;
                case '*': fResult = fVal1 * fVal2; break;
                case '/':
                    if (fVal2 === 0) {
                        MessageToast.show("0으로 나눌 수 없습니다.");
                        fResult = "Error";
                    } else {
                        fResult = fVal1 / fVal2;
                    }
                    break;
                default: return;
            }
            
            oModel.setProperty("/display", fResult.toString());
            oModel.setProperty("/currentValue", fResult);
        }
    });
});