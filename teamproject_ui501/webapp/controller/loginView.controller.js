sap.ui.define([
    "sap/ui/core/mvc/Controller",
    "sap/m/MessageToast",
    "sap/m/MessageBox"
], (Controller, MessageToast, MessageBox) => {
    "use strict";

    return Controller.extend("code.cl3.teamprojectui501.controller.loginView", {
        onInit() {
        },
        onLogin() { //아이디,비밀번호 로그인하는 코딩
            let sUserId, sPassword

            let ID2 = "ROOT", PW2 = "1234"; //관리자 아이디 값
            let ID3 = "USER", PW3 = "5678"; // 직원 아이디값 

            sUserId = this.getView().byId("userIdInput").getValue();
            sPassword = this.getView().byId("passwordInput").getValue();

            if (sUserId == ID2 && sPassword == PW2) {
                sap.ui.core.BusyIndicator.show(0); //로딩 표시
                setTimeout(function () {
                    sap.ui.core.BusyIndicator.hide();

                    // 로그인 성공 시
                    MessageBox.show("관리자님 반갑습니다.");

                    // 메인 화면으로 이동하거나 다음 작업 수행
                    // 관리자 아이디 자리 다음 라우팅스 자리 

                    var oRouter = this.getOwnerComponent().getRouter();
                    oRouter.navTo("ChartView");


                }.bind(this), 1000);
            } else if (sUserId == ID3 && sPassword == PW3) {
                sap.ui.core.BusyIndicator.show(0); //로딩 표시
                setTimeout(function () {
                    sap.ui.core.BusyIndicator.hide();

                    // 로그인 성공 시
                    MessageBox.show(ID3 +"님 반갑습니다.");

                    // 메인 화면으로 이동하거나 다음 작업 수행
                    // 직원 아이디 자리 + 다음 라우팅스 
                    var oRouter = this.getOwnerComponent().getRouter();
                    oRouter.navTo("RouteairlineView");
                }.bind(this), 1000);
            }
            else if (sUserId !== ID2 && sUserId !== ID3) {
                MessageBox.show("ID가 틀렸습니다.");
            }
            else if (sPassword !== PW2 && sPassword !== PW3) {
                MessageBox.show("PW가 틀렸습니다.");
            }
        },
    });
});