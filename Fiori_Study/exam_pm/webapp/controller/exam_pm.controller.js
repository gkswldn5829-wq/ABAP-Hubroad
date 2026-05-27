var vArray = [
                {player: "하트", Team:"NC"},
                {player: "네일", Team:"KIA"},
                {player: "헤이수스", Team:"키움"},
                {player: "원태인", Team:"삼성"},
                {player: "곽빈", Team:"두산"}
            ]; //문제 6번 for문으로 호출할 배열 전역변수로 선언
var calcul = "",result = ""; //11번 계산기 계산값을 저장할 calcul변수와 결과값을 내보낼 result 변수선언

sap.ui.define([
    "sap/ui/core/mvc/Controller",
    "sap/ui/model/json/JSONModel",
    "sap/ui/model/Filter",
	"sap/ui/model/FilterOperator"
], (Controller,JSONModel,Filter,FilterOperator) => {
    "use strict";

    return Controller.extend("code.cl3.exampm.controller.exam_pm", {
        onInit() {
            let J
            J = new JSONModel("/json/Asset.json") //문제 7번 제이슨 파일에 저장된 Asset.json파일을 생성자 new로 감싸서 객체로 만들어 변수 J에 저장
            this.getView().setModel(J,"server1"); //제이슨모델 객체 파일을 뷰에 호출하기 위해 setmodel로 호출하고 server1이라는 단독 네임 부여

            let D
            D = new JSONModel("/json/Companyson.json") //문제8번 제이슨 파일에 저장된 Companyson.json 파일을 생성자 new로 감싸 객체로 만들어 변수D로 저장
            this.getView().setModel(D,"server2"); //제이슨 모델 객체 파일을 뷰로 호출하기 위해 setmodel로 호출 후 server2라는 단독 네임 부여

            var oData = { //제이슨 모델 형식 객체 배열선언
                VizSet : [
                    {player : "박해민", Assist : "1"},
                    {player : "최지훈", Assist : "3"},
                    {player : "신민재", Assist : "212"},
                    {player : "문보경", Assist : "118"},
                    {player : "박성한", Assist : "1228"}    
                ]
            }
            let Chart //oData를 뷰로 보내기 위한 변수 Chart 선언
            Chart = new JSONModel(oData) //제이슨 모델형식의 배열을 new 생성자로 감싸 제이슨 모델 객체로 생성 후 변수 Chart에 저장
            this.getView().setModel(Chart,"server3"); //해당 객체 경로를 뷰로 호출하기 위한 setModel 후 단독 네임 server3부여

            var oData2 = {
                MicroSet : [
                   {
                    team : "KIA",
                    Homerun: 101
                   },
                   {
                    team : "두산",
                    Homerun: 95
                   },
                   {
                    team : "롯데",
                    Homerun: 68
                   },
                   {
                    team : "LG",
                    Homerun: 66
                   },
                   {
                    team : "SSG",
                    Homerun: 83
                   },
                   {
                    team : "키움",
                    Homerun: 63
                   },
                ]
            }
            let chart2 //oData2를 내보내기 위해 변수 chart2 선언
            chart2 = new JSONModel(oData2) //생성자로 감싸서 변수 저장
            this.getView().setModel(chart2,"server4") //뷰로 호출 단독네임 부여
        },
        onPress(){
            for(let A of vArray){
                console.log("vArray의 player :"+A.player); //전역함수 배열의 값을 콘솔로그에 나타내기 위해 반복문 for (of) 으로 배열 데이터 값 A에 저장 후 콘솔로그로 A나타냄
                console.log("vArray의 Team :"+A.Team) //전역함수 배열 객체에서 뽑아낸 값에서 team 속성에 해당하는 값을 콘솔로그에 나타냄
                console.log("---------------------------")
            }
        },
        onSearch(E){
            let array = []; //필터링 객체를 저장하기 위한 배열 변수 선언
            let Event = E.getParameter("query"); //필터 이벤트가 제공하는 메소드 겟파라미터의 하위 단위 query로 서치필드의 입력 값을 query로 받아와서 Event 변수에 저장
            if(Event){
                array.push(new Filter("Bktxt",FilterOperator.Contains,Event)); //이벤트에 값이 들어오면 선언했던 배열에 필터조건이 걸린 객체 저장, 생성자로 필터 객체 만들어 그 안에 필터의 조건 3가지 (검색대상필드,연산자,검색어)만듦
            }
            this.getView().byId("table").getBinding("rows").filter(array) //저장 되어있는 필터 객체를 적용할 테이블 타입Aggretion에 바인딩 시키고 테이블 경로를 찾을 수 있도록 적용시킬 테이블의 Id값 부여
        },
        onSearch2(E){
            let array = []; //필터링 객체를 저장하기 위한 배열 변수 선언
            let Event = E.getParameter("query"); //필터 이벤트가 제공하는 메소드 겟파라미터의 하위 단위 query로 서치필드의 입력 값을 query로 받아와서 Event 변수에 저장
            if(Event){
                array.push(new Filter("Comp",FilterOperator.Contains,Event));//이벤트에 값이 들어오면 선언했던 배열에 필터조건이 걸린 객체 저장, 생성자로 필터 객체 만들어 그 안에 필터의 조건 3가지 (검색대상필드,연산자,검색어)만듦
            }
            this.getView().byId("table2").getBinding("rows").filter(array) //저장 되어있는 필터 객체를 적용할 테이블 타입Aggretion에 바인딩 시키고 테이블 경로를 찾을 수 있도록 적용시킬 테이블의 Id값 부여
        },
        setNumber(V) { //계산기 버튼을 눌러서 받게될 매개변수 값을 V로 받음

            if(V == ""){  //계산기 버튼 값이 V에 담겨 들어오게 된 값이 공백값일때 발동하는 조건문 
                calcul = ""; //계산값 공백
                result = ""; //결과값 공백
                this.getView().byId("text").setValue(""); //인풋 아이디가 text인 곳에 공백을 내보내는 코드
                return; // 조건문 할당시 계산값을 빠지는 코드
            };

            switch (V) { //매개변수가 들어오면 수행할 조건문
                case "eq": //매개변수 값이 eq일 경우 
                    result = eval(calcul); //결과는 eval함수로 인해 텍스트가 모조리 산술값으로 치환되어 result에 담기게 된다.
                    this.getView().byId("text").setValue(result); //결과값을 텍스트창에 내보내는 코드
                    break; //eq 경로 스위치 구문 탈출
             
                default:
                    calcul += V; //매개변수에 담기는 데이터가 calcul에 계속 저장되도록 하는 코드
                    this.getView().byId("text").setValue(calcul); //calcul에 저장되는 값이 id값 text인 인풋태그에서 나타나도록 보 내보내는 함수
                    break; //default 만족시 스위치 구문 탈출
            }
        },
        goSecond(){
            const oRouter = this.getOwnerComponent().getRouter(); //다음 사이트로 넘어갈 수 있게 해주는 코드를 변수 Router에 저장
			oRouter.navTo("RoutesecondView"); //변수 Router에 함수로 연결되고자 하는 사이트의 라우트 경로 저장
        }
    });
});