var aArray = ["A", "B", "C", "D"];

sap.ui.define([
    "sap/ui/core/mvc/Controller",
    "sap/m/MessageToast"
], (Controller, MessageToast) => {
    "use strict";

    return Controller.extend("codecl3.day4ui501.controller.Day4_ui501", {
        onInit() {
        },
        input_check() {
            var aNumber = [10, 20, 30, 40, 50], t
            let matchFound = 0;
            t = Number(this.getView().byId("text").getValue());
            for (let a in aNumber) {
                if (t == aNumber[a]) {
                    matchFound = 1;
                    break;
                }
            }
            if (matchFound) {
                MessageToast.show("Match");
            } else {
                MessageToast.show("No");
            }
        },
        Sum() {
            let q, result =0;
            q = Number(this.getView().byId("Q").getValue());
            var vData = [10, 20, 30, 40, 50]
            for (let a of vData) {
                result += a;
            }
            result += q;
            this.getView().byId("result").setValue(result);
        },

        cont_check() {
            let i = 0
            while (i < 21) {
                if (i !== 2 && i !== 5 && i !== 12 && i !== 17) {
                    console.log(i);
                }
                i++
            }
        },
        
        Continue() {
            let k = 1
            while (k < 21) {
                if (k == 2 || k == 5 || k == 12 || k == 17) {
                    k++;
                    continue;
                }
                console.log(k)
                k++
            }
        },
        
        onChange(live){
            let record
            record =live.getParameters("value").value;
                console.log(record)
            this.getView().byId("input2").setValue(record);
        },
        onAppend(){
            
            let vVal
            //인풋 텍스트 값을 받아오기
            vVal=this.getView().byId("aval1").getValue();
            
            //appen to array, 전역함수 호출
            aArray.push(vVal);
            console.log(aArray);
            this.getView().byId("aval2").setValue(aArray);
        },
        
        onShift(){
            aArray.shift();
            console.log()

        },
        onPop(){
            aArray.pop()
            console.log("pop = "+ aArray);
        },
        onLength(){
            // aArray.length = 2;
            // console.log("length = "+ aArray)

            // for(let i =0; i <= aArray.length; i++){
            //     console.log(aArray[i])
            // }
            let i = aArray.length;

            for (let index = aArray.length; index <=aArray.length; index--) {
                aArray.length=index
                console.log("aArray = "+ aArray)
                
            }
        },
        onSplice(){
            aArray.splice(1,2,3)
            console.log("splice = "+aArray)
        },
        spText(){
            let Text1,Text2,Text3, v ;
            Text1=Number(this.getView().byId("text1").getValue());
            Text2=Number(this.getView().byId("text2").getValue());
            Text3=this.getView().byId("text3").getValue();
                aArray.splice(Text1,Text2,Text3);
                
                v = aArray
                console.log("첨삭된 어레이 = "+ aArray)
  
                this.getView().byId("text4").setValue(v);
        }
        


    });
});