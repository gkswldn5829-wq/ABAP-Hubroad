sap.ui.define([
    "sap/ui/core/mvc/Controller",
    "sap/m/MessageToast"
], (Controller, MessageToast) => {
    "use strict";

    return Controller.extend("code.cl3.day1ui501.controller.Day1View01", {
        onInit() {
        },
        oncheck() {
            // 변수 선언
            let vScore;
            //get value (내가 사용하고자 하는 값을 받아와야함)
            vScore = this.getView().byId("score").getValue();

            console.log(vScore); //브이스코어 값을 찍어보기 위해 만드는 시험용 consol.log

            // 입력된 점수 구간별로 등급을 결정하는 조건문 만들기
            if (vScore >= 90) {
                MessageToast.show("Grades:A")
            } else if (vScore >= 80) {
                MessageToast.show("Grades:B")
            } else if (vScore >= 70) {
                MessageToast.show("Grades:C")
            } else if (vScore >= 60) {
                MessageToast.show("Grades:D")
            } else {
                MessageToast.show("Grades:F")
            }
        },
        onpress() { //스위치를 시험하기 위해 만드는 함수
            let valpha;
            valpha = this.getView().byId("alpha").getValue(); //컨트롤러에서 뷰의 값을 가져오기 위한 컨트롤러 접근
            switch (valpha) { //특정한 값에 상응하는 값이 나오게 하는 스위치 함수
                case 'A':
                    MessageToast.show("apple")
                    break;
                case 'B':
                    MessageToast.show("Banana")
                    break;
                case 'C':
                    MessageToast.show("carrot")
                    break;
                case 'D':
                    MessageToast.show("d")
                    break;
                default:
                    MessageToast.show("올바른 값을 입력해주세요")
                    break;
            }

        }



    });
});