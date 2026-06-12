sap.ui.define([
    "sap/ui/core/format/DateFormat",
    "sap/ui/core/format/NumberFormat"
], (DateFormat, NumberFormat) => {
    "use strict";

    var oDateFormat = DateFormat.getDateInstance({ pattern: "yyyy.MM.dd" });
    var oNumberFormat = NumberFormat.getIntegerInstance({ groupingEnabled: true });

    // DashStep 도메인 (백엔드 계산값) — 핸드오프 2.4 상태 매트릭스
    var mStepText = {
        "0": "분류불가",
        "1": "상품준비",
        "2": "출하대기",
        "3": "출발대기",
        "4": "배송중",
        "5": "배송완료"
    };
    var mStepState = {
        "0": "Error",
        "1": "None",
        "2": "Warning",
        "3": "Indication03",
        "4": "Information",
        "5": "Success"
    };

    /**
     * Edm.Time 값을 "HH:mm" 문자열로 변환.
     * V2 ODataModel이 주는 형태가 컨텍스트마다 달라서 전부 수용한다:
     *   {ms: 28800000, __edmType: 'Edm.Time'} 객체 / "PT08H00M00S"·"PT8H" 듀레이션 문자열
     *   / 밀리초 숫자 / Date 객체(UTC 기준).
     * 00:00:00은 TIMS 미입력으로 간주 (시나리오상 자정 배송 없음) → 빈 문자열 반환.
     */
    function timeToString(vTime) {
        var iMs = null;
        if (vTime === null || vTime === undefined || vTime === "") {
            return "";
        }
        if (vTime instanceof Date) {
            iMs = (((vTime.getUTCHours() * 60) + vTime.getUTCMinutes()) * 60 + vTime.getUTCSeconds()) * 1000;
        } else if (typeof vTime === "object" && vTime.ms !== undefined) {
            iMs = parseInt(vTime.ms, 10);
        } else if (typeof vTime === "number") {
            iMs = vTime;
        } else if (typeof vTime === "string") {
            var aMatch = /^PT(?:(\d+)H)?(?:(\d+)M)?(?:(\d+)(?:\.\d+)?S)?$/.exec(vTime);
            if (aMatch) {
                iMs = ((Number(aMatch[1] || 0) * 3600) + (Number(aMatch[2] || 0) * 60) + Number(aMatch[3] || 0)) * 1000;
            }
        }
        if (iMs === null || isNaN(iMs) || iMs === 0) {
            return "";
        }
        var iH = Math.floor(iMs / 3600000);
        var iM = Math.floor((iMs % 3600000) / 60000);
        return (iH < 10 ? "0" : "") + iH + ":" + (iM < 10 ? "0" : "") + iM;
    }

    /**
     * 4단계 진행 인디케이터 단계 판정 — 핸드오프 2.4 매핑.
     * step1 상품준비: DashStep>=1 진행, >=2 완료
     * step2 출하:     DashStep 2~3 진행, >=4 완료
     * step3 배송중:   DashStep 4 진행, 5 완료
     * step4 도착완료: DashStep 5 완료
     * @returns {"done"|"active"|"pending"}
     */
    function stepPhase(sDashStep, iStep) {
        var i = parseInt(sDashStep, 10);
        if (isNaN(i) || i === 0) {
            return "pending";
        }
        switch (iStep) {
            case 1: return i >= 2 ? "done" : "active";
            case 2: return i >= 4 ? "done" : (i >= 2 ? "active" : "pending");
            case 3: return i >= 5 ? "done" : (i === 4 ? "active" : "pending");
            case 4: return i >= 5 ? "done" : "pending";
            default: return "pending";
        }
    }

    var mStepIcon = {
        1: "sap-icon://product",           // 상품준비
        2: "sap-icon://outbox",            // 출하
        3: "sap-icon://shipping-status",    // 배송
        4: "sap-icon://home"                // 도착
    };

    function stepIcon(sDashStep, iStep) {
        var sPhase = stepPhase(sDashStep, iStep);
        if (sPhase === "done") {
            return "sap-icon://sys-enter-2"; // 완료는 V 체크
        }
        // 각 단계별 고유 아이콘 반환
        return mStepIcon[iStep] || "sap-icon://circle-task";
    }

    function stepColor(sDashStep, iStep) {
        var sPhase = stepPhase(sDashStep, iStep);
        if (sPhase === "done") {
            return "#107e3e";   // 시맨틱 Success
        }
        return sPhase === "active" ? "#0070f2" : "#bcc3ca";
    }

    var formatter = {

        /** Dlvdat(JS Date) → "yyyy.MM.dd" */
        date(vDate) {
            if (!vDate) {
                return "";
            }
            return oDateFormat.format(vDate instanceof Date ? vDate : new Date(vDate));
        },

        /** Totpr/Brtwr 문자열 → "₩1,234,000" (KRW 소수점 없음) */
        currency(vValue) {
            if (vValue === null || vValue === undefined || vValue === "") {
                return "";
            }
            var fValue = parseFloat(vValue);
            if (isNaN(fValue)) {
                return "";
            }
            return "₩" + oNumberFormat.format(fValue);
        },

        /** 빈값 → "-" (DOP4000026처럼 차량 영역 빈값 graceful 처리) */
        dash(sValue) {
            return sValue ? sValue : "-";
        },

        /** DashStep + Pkqt(헤더) → 상태 배지 텍스트. Pkqt ''는 진행중 취급 */
        stepText(sDashStep, sPkqt) {
            var sText = mStepText[sDashStep] || mStepText["0"];
            if (sDashStep === "1") {
                sText += sPkqt === "01" ? " · 준비완료" : " · 진행중";
            }
            return sText;
        },

        /** DashStep → ObjectStatus state */
        stepState(sDashStep) {
            return mStepState[sDashStep] || "Error";
        },

        /** 예외 건 행 강조: 차량이상 Error > 미배차 Warning > 분류불가 Error */
        rowHighlight(sNoVehicleFlg, sVhcIssueFlg, sDashStep) {
            if (sVhcIssueFlg === "X") {
                return "Error";
            }
            if (sNoVehicleFlg === "X") {
                return "Warning";
            }
            if (sDashStep === "0") {
                return "Error";
            }
            return "None";
        },

        /** Schtm → "출발 08:00" (미입력 시 빈 문자열) */
        depTimeText(vTime) {
            var sTime = timeToString(vTime);
            return sTime ? "출발 " + sTime : "";
        },

        /** Arrtm → "도착예정(계획) 10:30" — '실시간' 아님, 스케줄 계획시간 */
        arrTimeText(vTime) {
            var sTime = timeToString(vTime);
            return sTime ? "도착예정(계획) " + sTime : "";
        },

        /** 상세 Dialog용: 시간 또는 "-" (00:00:00 = 미입력) */
        timeOrDash(vTime) {
            return timeToString(vTime) || "-";
        },

        /** 아이템 Pkqt: 01 피킹완료 / 02 패킹완료 / 그 외 진행중 */
        itemPkqt(sPkqt) {
            if (sPkqt === "01") {
                return "피킹완료";
            }
            if (sPkqt === "02") {
                return "패킹완료";
            }
            return "진행중";
        },

        /** 아이템 Pkqt 상태 색상: 완료는 Success, 진행중은 Warning */
        itemPkqtState(sPkqt) {
            if (sPkqt === "01" || sPkqt === "02") {
                return "Success";
            }
            return "Warning";
        },

        /** 플랜트 코드 → 명칭 (1000: 오산, 2000: 파주) */
        plantName(sPlant) {
            if (sPlant === "1000") {
                return "오산";
            }
            if (sPlant === "2000") {
                return "파주";
            }
            return sPlant;
        },

        /** 수량 + 단위 ("100 EA"), 빈값 graceful */
        quantity(vQty, sUnit) {
            if (vQty === null || vQty === undefined || vQty === "") {
                return "";
            }
            var fValue = parseFloat(vQty);
            if (isNaN(fValue)) {
                return "";
            }
            return oNumberFormat.format(fValue) + (sUnit ? " " + sUnit : "");
        },

        // ── 진행 인디케이터 단계별 래퍼 (XML 바인딩은 추가 인자를 못 넘기므로) ──
        step1Icon(s) { return stepIcon(s, 1); },
        step2Icon(s) { return stepIcon(s, 2); },
        step3Icon(s) { return stepIcon(s, 3); },
        step4Icon(s) { return stepIcon(s, 4); },
        step1Color(s) { return stepColor(s, 1); },
        step2Color(s) { return stepColor(s, 2); },
        step3Color(s) { return stepColor(s, 3); },
        step4Color(s) { return stepColor(s, 4); }
    };

    return formatter;
});
