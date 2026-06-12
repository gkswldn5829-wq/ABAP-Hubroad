sap.ui.define([], function () {
    "use strict";

    return {
        // OData Criticality(Byte) → sap.ui.core.ValueState
        // 0=None, 1=Error(폐기), 2=Warning, 3=Success(활성)
        criticalityToState: function (iVal) {
            var oMap = { 0: "None", 1: "Error", 2: "Warning", 3: "Success" };
            return oMap[parseInt(iVal, 10)] !== undefined ? oMap[parseInt(iVal, 10)] : "None";
        },

        // 거래유형코드 → 표시 텍스트
        trtypToText: function (sTrtyp) {
            var oMap = { "01": "01 취득", "02": "02 감가상각", "03": "03 처분" };
            return oMap[sTrtyp] || sTrtyp;
        },

        // 거래유형코드 → ObjectStatus state
        trtypToState: function (sTrtyp) {
            if (sTrtyp === "01") return "Information";
            if (sTrtyp === "03") return "Error";
            return "Warning";
        },

        // 플랜트코드 → 사업장명
        werksToText: function (sWerks) {
            var oMap = { "1000": "오산", "2000": "파주" };
            return oMap[sWerks] || sWerks;
        },

        // 자산분류코드 → 짧은 분류명 (목록용)
        anlklToName: function (sAnlkl) {
            var oMap = {
                "1000": "건물", "2000": "구축물",
                "3000": "기계장치", "4000": "차량운반구",
                "5000": "비품", "6000": "냉장냉동설비",
                "7000": "전산장비"
            };
            return oMap[sAnlkl] || sAnlkl;
        },

        // 자산분류코드(ZCDS_VH_C3_FI_0004) → ObjectStatus state
        // 1000=건물, 2000=구축물, 3000=기계장치, 4000=차량운반구
        // 5000=비품, 6000=냉장냉동설비, 7000=전산장비
        anlklToState: function (sAnlkl) {
            var iCode = parseInt(sAnlkl, 10);
            if (iCode === 1000 || iCode === 2000) return "Success";
            if (iCode === 4000) return "Warning";
            if (iCode >= 3000 && iCode <= 7000) return "Information";
            return "None";
        },

        // 자산분류코드 → 한국어 텍스트
        anlklToText: function (sAnlkl) {
            var oMap = {
                "1000": "1000 건물", "2000": "2000 구축물",
                "3000": "3000 기계장치", "4000": "4000 차량운반구",
                "5000": "5000 비품", "6000": "6000 냉장냉동설비",
                "7000": "7000 전산장비"
            };
            return oMap[sAnlkl] || sAnlkl;
        },

        // 상각방법코드 → 한국어 텍스트
        afamidToText: function (sAfamid) {
            var oMap = { "00": "상각안함", "01": "정액법", "02": "정률법" };
            return oMap[sAfamid] || sAfamid;
        },

        // 내용연수 → 숫자+"년" 형태
        ndjarToText: function (sNdjar) {
            if (!sNdjar && sNdjar !== 0) { return ""; }
            return sNdjar + "년";
        },

        // Criticality → ObjectStatus 아이콘
        // 3=활성(Success), 1=폐기(Error)
        criticalityToIcon: function (iVal) {
            var oMap = { 1: "sap-icon://status-negative", 3: "sap-icon://status-positive" };
            return oMap[parseInt(iVal, 10)] || "";
        }
    };
});
