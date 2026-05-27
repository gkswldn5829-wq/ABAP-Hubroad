sap.ui.define([
    "sap/ui/core/mvc/Controller"
], (Controller) => {
    "use strict";

    return Controller.extend("code.cl3.examam.controller.exam_am", {
        onInit() { //화면이 나타나자 마자 출력될 1번 문제 온잇에 작성
            let id="Fiori 입력창", id3="RTX1253"; //입력 필드에 나타낼 변수 선언, 텍스트 값 부여
            this.getView().byId("id").setValue(id); //id 를 id로 가진 인풋에 변수 id 값을 뷰로 호출
            this.getView().byId("id3").setValue(id3); //id 를 id3으로 가진 인풋에 변수 id3 값을 뷰로 호출
        },
        onFor(){
            for(let i=2;i<10;i++){ //구구단 바깥부터 시작할 변수 i초기값,i한계값,i증가값
                for(let j=2;j<10;j++){ // 구구단 안쪽 시작할 반복문 j초기값,j한계값,j증가값
                    console.log(i+"x"+j+"="+i*j); //콘솔로그에 나타낼 구구단 
                }
            }
        },
        onWhile(){ 
            let i=2; //바깥쪽 while반복문 변수, 초기값
            while (i<10) {  //바깥쪽 while문 한계값
                let j=2; //안쪽 while 반복문 변수,초기값
                while(j<10){ //안쪽 while 반복문 한계값 
                    console.log(i+"x"+j+"="+i*j); //콘솔로그에 나타낼 구구단 
                    j++ //j반복을 멈출 증가값
                }
             i++ //ㅑ반복을 멈출 증가값
            }
        },
        onForWhile(){
            
            for(let i=2;i<10;i++){ //구구단 바깥부터 시작할 변수 i초기값,i한계값,i증가값
                let j=2; //while반복문 변수선언 초기값 부여
                while(j<10){ //while반복문 변수선언 조건문
                    console.log(i+"x"+j+"="+i*j); //콘솔로그에 나타낼 구구단
                    j++; //j 구구단 반복문을 멈출 증가값
                }
            }
        },
        cont_check(){
            let input //입력값 받을 변수선언
            input=this.getView().byId("Number").getValue(); //id이름 부여한 인풋 Number로부터 입력값을 받아와 선언했던 input 변수에 저장

            for(let i=2; i<10;i++){ //for 문을 통해 시행될 바깥쪽 구구단 반복문 
                if(i == input){ //사용자의 입력값과 시행될 구구단이 일치할시 continue로 되돌아가면서 해당 구구단이 시행 안되도록 하는 조건문 
                    continue;
                }
                for(let j=2 ;j<10;j++){ //안쪽 구구단 반복문
                    console.log(i + "x" + j + "=" + i * j); //콘솔로그에 나타낼 구구단 
                }
            }
        },
        gugu(){
            for (let i = 2; i < 10; i++) { //바깥부터 시작할 i 구구단 반복문 
                    if (i % 2 == 0) { //i의 값이 짝수로 딱 나눠떨어질때에만 시행할 조건으로 나머지 0이라는 조건 부여
                        for (let j = 1; j < 10; j++) { //안쪽에 시행될 구구단 반복문 
                            console.log(i + "x" + j + "=" + i * j) //콘솔로그에 나타낼 구구단
                        }
                    }
                }
        },
        array(){
            let result = 1; //결과값을 저장할 변수 선언, 초기값 부여
            var vData = [10,20,30,40,50]; //배열 선언
            for(let i of vData){ //배열의 값을 추출하는 for(of) 반복문 선언
                result = result*i //반복문을 돌며 배열의 값이 곱해질때마다 result에 저장되는 로직을 for 문 안쪽에 코딩
            };
            this.getView().byId("id4").setValue(result); //결과값을 id4를 가진 텍스트로 내보냄 
        }
    });
});