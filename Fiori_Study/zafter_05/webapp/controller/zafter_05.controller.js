sap.ui.define([
    "sap/ui/core/mvc/Controller",
    "sap/m/MessageToast"
], (Controller, MessageToast) => {
    "use strict";

    return Controller.extend("zcl327.zafter05.controller.zafter_05", {
        onInit() {
        },
        onDisplay: function () {
            var oTable = this.getView().byId("Table"); // 테이블 아이디로 테이블 객체 가져오기
            let aIndex = oTable.getSelectedIndices(), // 선택된 행의 인덱스 가져오기
                oData = oTable.getContextByIndex(aIndex[0]).getObject(), // 선택된 행의 인덱스를 이용하여 해당 행의 데이터를 가져오기
                
                oModel = this.getView().getModel(); // 모델 가져오기

            console.log(oModel); // oData 어떻게 담아오는지 찍어보기

            oModel.read("/StudentSet('" + oData.StdtNo + "')",
                {
                    success: function (oReturn) {
                        this.getView().byId("StdtNo").setValue(oReturn.StdtNo); // 가져온 데이터의 StdtNo 값을 StdtNo 입력 필드에 설정
                        this.getView().byId("Major").setValue(oReturn.Major); //    가져온 데이터의 Major 값을 Major 입력 필드에 설정
                        this.getView().byId("StdtName").setValue(oReturn.StdtName);
                        this.getView().byId("Addr").setValue(oReturn.Addr);
                        this.getView().byId("Email").setValue(oReturn.Email);
                        this.getView().byId("Gender").setValue(oReturn.Gender);
                    }.bind(this), // success 콜백 함수에서 this가 컨트롤러를 가리키도록 바인딩
                    error: function () {   // 데이터 가져오기 실패 시 에러 처리
                        MessageToast.show("데이터를 가져오는 데 실패했습니다."); // 에러 메시지 표시
                    }
                }
            )
        },
        onCreate: function () {
            let oModel = this.getView().getModel(); // 모델 가져오기

            let oEntry = { // 새로 생성할 데이터 객체
                StdtNo: this.getView().byId("StdtNo").getValue(),
                Major: this.getView().byId("Major").getValue(),
                StdtName: this.getView().byId("StdtName").getValue(),
                Addr: this.getView().byId("Addr").getValue(),
                Email: this.getView().byId("Email").getValue(),
                Gender: this.getView().byId("Gender").getValue()
            };
            oModel.create("/StudentSet", oEntry, { // StudentSet 엔티티셋에 oEntry 객체를 생성
                success: function () {
                    oModel.refresh();
                    MessageToast.show("학생 데이터가 새롭게 생성되었습니다.");
                    this.getView().byId("StdtNo").setValue(""); // 입력 필드 초기화
                    this.getView().byId("Major").setValue("");
                    this.getView().byId("StdtName").setValue("");
                    this.getView().byId("Addr").setValue("");
                    this.getView().byId("Email").setValue("");
                    this.getView().byId("Gender").setValue("");
                }.bind(this),
                error: function () {
                    MessageToast.show("학생관리 데이터 생성에 실패했습니다.");
                }
            });
        },
        onUpdate: function () {
            let oModel = this.getView().getModel(); // 모델 가져오기

            var vStdtNo = this.getView().byId("StdtNo").getValue(); // 업데이트할 ID(pk) 가져오기

            let oEntry = { // 업데이트할 데이터 객체
                StdtNo: this.getView().byId("StdtNo").getValue(),
                Major: this.getView().byId("Major").getValue(),
                StdtName: this.getView().byId("StdtName").getValue(),
                Addr: this.getView().byId("Addr").getValue(),
                Email: this.getView().byId("Email").getValue(),
                Gender: this.getView().byId("Gender").getValue(),
            };

            oModel.update("/StudentSet('" + vStdtNo + "')", oEntry, {
                success: function () {
                    oModel.refresh(); // 모델 새로고침하여 변경된 데이터 반영
                    MessageToast.show("학생관리 테이블이 업데이트되었습니다.");
                    this.getView().byId("StdtNo").setValue(""); // 입력 필드 초기화
                    this.getView().byId("Major").setValue(""); // 입력 필드 초기화
                    this.getView().byId("StdtName").setValue("");
                    this.getView().byId("Addr").setValue("");
                    this.getView().byId("Email").setValue("");
                    this.getView().byId("Gender").setValue("");
                }.bind(this),
                error: function () {
                    MessageToast.show("학생관리 데이터 업데이트에 실패했습니다.");
                }
            });
        },
        onDelete: function () {
            let oModel = this.getView().getModel(); // 모델 가져오기
            let aIndex = this.getView().byId("Table").getSelectedIndices(); // 선택된 행의 인덱스 가져오기

            if (aIndex < 1) {
                MessageToast.show("삭제할 행을 선택해주세요.");
                return;
            }

            var oEntry = this.getView().byId("Table").getContextByIndex(aIndex[0]).getObject();

            oModel.remove("/StudentSet('" + oEntry.StdtNo + "')", {
                success: function () {
                    oModel.refresh(); // 모델 새로고침하여 변경된 데이터 반영
                    MessageToast.show("데이터가 삭제되었습니다.");
                    this.getView().byId("Major").setValue(""); // 입력 필드 초기화
                    this.getView().byId("StdtName").setValue("");
                    this.getView().byId("Addr").setValue("");
                    this.getView().byId("Email").setValue("");
                    this.getView().byId("Gender").setValue("");
                }.bind(this),
                error: function () {
                    MessageToast.show("데이터 삭제에 실패했습니다.");
                }
            }
            );
        }
    });
});