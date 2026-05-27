sap.ui.define([
    "sap/ui/core/mvc/Controller",
    "sap/ui/model/Filter",
	"sap/ui/model/FilterOperator",
    "sap/m/MessageToast"
], (Controller,Filter,FilterOperator,MessageToast) => {
    "use strict";

    return Controller.extend("zcl327.ztest01.controller.ztest_01", {
        onInit() {
        },
        onSearch(){
            let input1,input2,input3,array=[];
            input1 = this.getView().byId("word").getValue();
            input2 = this.getView().byId("word2").getValue();

            if(input1!==''){
                array.push(new Filter("Remark",FilterOperator.Contains,input1));
            }
            if(input2!==''){
                array.push(new Filter("Belnr",FilterOperator.Contains,input2));
            }
            if(array.length>=0){
                this.getView().byId("Table").getBinding("rows").filter(array);
            }
        },onDisplay: function () {

            var oTable = this.getView().byId("Table"); // 테이블 아이디로 테이블 객체 가져오기
            let aIndex = oTable.getSelectedIndices(), // 선택된 행의 인덱스 가져오기
                oData = oTable.getContextByIndex(aIndex[0]).getObject(), // 선택된 행의 인덱스를 이용하여 해당 행의 데이터를 가져오기
                oModel = this.getView().getModel(); // 모델 가져오기
            console.log(oModel); // oData 어떻게 담아오는지 찍어보기
            oModel.read("/HomeShoppingSet('" + 'Ryear = ' + oData.Ryear + "','" + 'Rbukrs = ' + oData.Rbukrs + "','" + 'Belnr = ' + oData.Belnr + "')'", 
            { 
                success: function (oReturn) {
                    this.getView().byId("Ryear").setValue(oReturn.Ryear); // Ryear는 PK이므로 업데이트할 때 필요
                    this.getView().byId("Rbukrs").setValue(oReturn.Rbukrs);
                    this.getView().byId("Belnr").setValue(oReturn.Belnr);
                    this.getView().byId("Racct").setValue(oReturn.Racct);
                    this.getView().byId("Remark").setValue(oReturn.Remark);
                    this.getView().byId("Hsl").setValue(oReturn.Hsl);
                    this.getView().byId("PostYn").setValue(oReturn.PostYn);
                }.bind(this), // success 콜백 함수에서 this가 컨트롤러를 가리키도록 바인딩
                error: function () {
                    MessageToast.show("데이터를 가져오는 데 실패했습니다.");}
            }
            )    
        },
        onCreate: function () {
            let oModel = this.getView().getModel(); // 모델 가져오기
            let oEntry = { // 새로 생성할 데이터 객체
                Ryear: this.getView().byId("Ryear").getValue(),     // 입력 
                Rbukrs: this.getView().byId("Rbukrs").getValue(), // 입력 필드에서 Rbukrs 값 가져오기
                Belnr: this.getView().byId("Belnr").getValue(), // 입력 필드에서 Belnr 값 가져오기
                Racct: this.getView().byId("Racct").getValue(), // 입력 필드에서 Racct 값 가져오기
                Remark: this.getView().byId("Remark").getValue(), // 입력 필드에서 Remark 값 가져오기
                Hsl: this.getView().byId("Hsl").getValue(), // 입력 필드에서 Hsl 값 가져오기
                PostYn: this.getView().byId("PostYn").getValue()            
            };
            oModel.create("/HomeShoppingSet", oEntry, { // HomeShoppingSet 엔티티셋에 oEntry 객체를 생성
                success: function () {
                    MessageToast.show("데이터가 생성되었습니다."); 
                    this.getView().byId("Ryear").setValue(""); // 입력 필드 초기화
                    this.getView().byId("Rbukrs").setValue(""); 
                    this.getView().byId("Belnr").setValue("");
                    this.getView().byId("Racct").setValue("");
                    this.getView().byId("Remark").setValue("");
                    this.getView().byId("Hsl").setValue("");
                    this.getView().byId("PostYn").setValue("");
                }.bind(this),
                error: function () {
                    MessageToast.show("데이터 생성에 실패했습니다.");
                }
            });
        },
        onUpdate: function () {
            let oModel = this.getView().getModel(); // 모델 가져오기

            var vRyear = this.getView().byId("Ryear").getValue(); // 업데이트할 항목 ID(pk) 가져오기
                
            let oEntry = { // 업데이트할 데이터 객체
                Rbukrs: this.getView().byId("Rbukrs").getValue(), // 입력 필드에서 Rbukrs 값 가져오기
                Belnr: this.getView().byId("Belnr").getValue(), // 입력 필드에서 Belnr 값 가져오기
                Racct: this.getView().byId("Racct").getValue(), // 입력 필드에서 Racct 값 가져오기
                Remark: this.getView().byId("Remark").getValue(), // 입력 필드에서 Remark 값 가져오기
                Hsl: this.getView().byId("Hsl").getValue(), // 입력 필드에서 Hsl 값 가져오기
                PostYn: this.getView().byId("PostYn").getValue()            
            };

            oModel.update("/HomeShoppingSet('" + vRyear + "') ", oEntry, { // HomeShoppingSet 엔티티셋에서 Ryear가 vRyear인 항목을 oEntry 객체로 업데이트
                success: function () {
                    oModel.refresh(); // 모델 새로고침하여 변경된 데이터 반영
                    MessageToast.show("데이터가 업데이트되었습니다.");
                    this.getView().byId("Ryear").setValue(""); // 입력 필드 초기화
                    this.getView().byId("Rbukrs").setValue(""); 
                    this.getView().byId("Belnr").setValue("");
                    this.getView().byId("Racct").setValue("");
                    this.getView().byId("Remark").setValue("");
                    this.getView().byId("Hsl").setValue("");
                    this.getView().byId("PostYn").setValue("");
                },
                error: function () {
                    MessageToast.show("데이터 업데이트에 실패했습니다.");
                }
                }
            );
        },
        onDelete: function () {
            let oModel = this.getView().getModel(); // 모델 가져오기
            let aIndex = this.getView().byId("Table").getSelectedIndices(); // 선택된 행의 인덱스 가져오기

            if (aIndex < 1) {
                MessageToast.show("삭제할 항목을 선택해주세요.");
                return;
            }

            var oEntry = this.getView().byId("Ryear").getValue(); // 삭제할 항목 ID(pk) 가져오기

            oModel.remove("/HomeShoppingSet('" + oEntry + "')", { // HomeShoppingSet 엔티티셋에서 Ryear가 oEntry인 항목 삭제
                success: function () {
                    oModel.refresh(); // 모델 새로고침하여 변경된 데이터 반영
                    MessageToast.show("데이터가 삭제되었습니다.");
                    this.getView().byId("Ryear").setValue(""); // 입력 필드 초기화
                    this.getView().byId("Rbukrs").setValue(""); 
                    this.getView().byId("Belnr").setValue("");
                    this.getView().byId("Racct").setValue("");
                    this.getView().byId("Remark").setValue("");
                    this.getView().byId("Hsl").setValue("");
                    this.getView().byId("PostYn").setValue("");
                }.bind(this),
                error: function () {
                    MessageToast.show("데이터 삭제에 실패했습니다.");
                }
                }
            );
        },
    });
});