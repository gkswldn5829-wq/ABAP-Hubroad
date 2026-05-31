# gemini advisor artifact

- Provider: gemini
- Exit code: 0
- Created at: 2026-05-27T09:56:57.580Z

## Original task

SAP Fiori GL전표 입력 앱(0004) 검수: 1) 작성자 ID가 저장 페이로드에 포함되지 않는 UX 이슈 2) 저장 후 resetForm에서 userId가 날아가지 않아야 하는 이유 3) 첨부파일 업로드 시 저장 성공 메시지와 첨부 업로드가 순서 문제 있는지 4) 차대변 밸런스 체크 엣지케이스 (0원 입력, 소수점 등) 5) 전체 기능 검수 포인트 나열해줘

## Final prompt

SAP Fiori GL전표 입력 앱(0004) 검수: 1) 작성자 ID가 저장 페이로드에 포함되지 않는 UX 이슈 2) 저장 후 resetForm에서 userId가 날아가지 않아야 하는 이유 3) 첨부파일 업로드 시 저장 성공 메시지와 첨부 업로드가 순서 문제 있는지 4) 차대변 밸런스 체크 엣지케이스 (0원 입력, 소수점 등) 5) 전체 기능 검수 포인트 나열해줘

## Raw output

```text
SAP Fiori GL전표 입력 앱(0004)에 대한 검수 결과 및 개선 권고 사항입니다. 분석된 코드를 바탕으로 요청하신 5가지 포인트에 대해 답변 드립니다.

---

### 1) 작성자 ID 저장 페이로드 누락 (UX 및 데이터 정합성)
*   **현황:** `onSave` 함수(컨트롤러 485~497행)에서 `oHeader` 생성 시, `USNAM`(또는 `Uname`) 필드가 포함되지 않고 있습니다. HR 데이터(`_loadHRData`)를 통해 사번(`userPernr`)과 성명(`userName`)을 이미 가지고 있음에도 저장 시 전달하지 않습니다.
*   **해결 방법:** `oHeader` 객체에 사번을 추가해야 합니다.
    ```javascript
    var oHeader = {
        // ... 기존 필드
        Uname: oModel.getProperty("/userPernr"), // 백엔드 필드명에 맞춰 추가 (예: USNAM)
        Zstat: "01"
    };
    ```

### 2) 저장 후 resetForm에서 userId 유지 필요성
*   **현황:** 현재 `_resetForm`(419행)은 `/userName`, `/userPernr`를 초기화하지 않으므로 데이터는 유지됩니다.
*   **이유 (UX 관점):**
    *   **로그인 세션의 불변성:** 작성자 정보는 현재 로그인한 사용자의 고정 정보입니다. 전표를 하나 저장했다고 해서 작성자가 바뀌지 않으므로 초기화 대상이 아닙니다.
    *   **재조회 비용 방지:** 초기화 시 사번을 날리면 다시 HR OData를 호출하거나 `start_up` 서비스를 호출해야 하므로 불필요한 네트워크 트래픽과 화면 깜빡임이 발생합니다.
    *   **사용자 인지:** 작성자 칸이 비어있으면 사용자는 "시스템이 나를 인식하지 못하고 있나?"라는 불안감을 느낄 수 있습니다.

### 3) 저장 성공 메시지와 첨부 업로드 순서 문제
*   **심각한 결함 발견:** 현재 코드(515~530행)에 로직 충돌이 있습니다.
    1.  `that._uploadAttachments(...)` 호출 (비동기 시작)
    2.  `MessageBox.success` 표시
    3.  **`that._resetForm()` 즉시 실행**
*   **문제점:** `_resetForm`이 실행되면 `viewModel`의 `/attachments` 배열이 빈 값(`[]`)이 됩니다. 그러나 `_uploadAttachments` 내부에서는 파일 업로드 상태(성공/실패)를 `/attachments/{index}/statusText` 경로에 업데이트하려고 시도합니다. 배열이 비워졌으므로 이 업데이트는 실패하며, 사용자는 파일이 실제로 올라갔는지 알 수 없습니다.
*   **개선안:** 
    *   파일 업로드가 있는 경우, 업로드가 모두 완료된 후(`iDone === iTotal`)에 `_resetForm`을 호출하거나,
    *   업로드 중에는 "업로드 중..." 상태를 보여주는 BusyDialog를 사용하여 프로세스를 동기화해야 합니다.

### 4) 차대변 밸런스 체크 엣지케이스
*   **0원 입력:** `onSave`에서 `nAmt <= 0`를 체크하여 차단하고 있어 안전합니다.
*   **소수점 처리:** `Math.abs(nDebit - nCredit) > 0.01` 방식을 사용하여 부동소수점 오차를 허용하면서 밸런스를 체크합니다. (KRW의 경우 보통 정수지만, USD 등을 고려한 적절한 로직입니다.)
*   **통화별 라운딩:** 현재 `_fmt` 함수가 `Math.round`를 강제하고 있습니다. KRW는 괜찮으나, USD나 JPY(소수점 없음) 등 통화코드(`waers`)에 따른 동적 포맷팅(`sap.ui.core.format.NumberFormat`) 적용이 권장됩니다.
*   **빈 라인:** 계정번호가 10자리가 아니거나 금액이 없는 경우 `bItemErr`로 처리되어 누락된 입력에 대해 견고하게 대응하고 있습니다.

### 5) 전체 기능 검수 포인트 (체크리스트)
1.  **전기일/증빙일 유효성:** 미래 날짜 입력 가능 여부 (비즈니스 로직에 따라 제한 필요 시 확인).
2.  **계정과목 정합성:** 입력한 `saknr`이 마스터(`ACCT_DATA`)에 없는 경우 `onSaknrChange`에서 "—"로 표시되는데, 이 상태로 저장이 시도되지 않는지 확인.
3.  **세금코드-세액 연동:** 세금코드를 변경했을 때 `wmwst`(세액)이 즉시 재계산되어 밸런스에 반영되는지 (현재 `onMwskzInputChange`에 구현됨).
4.  **파일 제한:** `_oFileInput.accept`에 정의된 확장자 외에 대용량 파일 업로드 시 브라우저/서버 타임아웃 처리.
5.  **중복 저장 방지:** `onSave` 클릭 시 버튼을 `setBusy(true)` 처리하여 더블 클릭으로 인한 전표 중복 생성을 방지하고 있는지.
6.  **전기키(BSCHL) 자동 할당:** 전표유형(SA 등)과 차대변(S/H) 선택에 따라 전기키가 SAP 표준(40, 50 등)에 맞게 정확히 매핑되는지.

위 사항들을 보완하면 더욱 안정적인 GL 전표 입력 앱이 될 것입니다. 특히 **3번(업로드-초기화 순서)**은 반드시 수정이 필요합니다.


YOLO mode is enabled. All tool calls will be automatically approved.
YOLO mode is enabled. All tool calls will be automatically approved.
Ripgrep is not available. Falling back to GrepTool.

```

## Concise summary

Provider completed successfully. Review the raw output for details.

## Action items

- Review the response and extract decisions you want to apply.
- Capture follow-up implementation tasks if needed.
