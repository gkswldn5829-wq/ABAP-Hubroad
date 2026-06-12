# codex advisor artifact

- Provider: codex
- Exit code: 0
- Created at: 2026-06-02T07:29:04.909Z

## Original task

SAP RAP OData V4 Draft 423 Lock 근본 해결. 상황: PreserveChanges=true로도 Edit() 액션이 423 반환. 원인: 동일 자산에 Fiori Elements 배포환경에서 생성된 Draft가 존재해 Lock 유지. 해결책 검토: 1) onEdit() 함수에서 HasDraftEntity=true 확인 → Edit 액션 호출 없이 IsActiveEntity=false로 직접 navTo하는 패턴의 올바름 여부, 2) 이 방식이 Fiori Elements의 실제 동작과 동일한지, 3) HasDraftEntity=true인데 Draft가 타 사용자 소유일 때 IsActiveEntity=false 바인딩 결과, 4) Detail view에서 HasDraftEntity를 oCtx.getProperty()로 읽을 때 에 포함 필요 여부

## Final prompt

SAP RAP OData V4 Draft 423 Lock 근본 해결. 상황: PreserveChanges=true로도 Edit() 액션이 423 반환. 원인: 동일 자산에 Fiori Elements 배포환경에서 생성된 Draft가 존재해 Lock 유지. 해결책 검토: 1) onEdit() 함수에서 HasDraftEntity=true 확인 → Edit 액션 호출 없이 IsActiveEntity=false로 직접 navTo하는 패턴의 올바름 여부, 2) 이 방식이 Fiori Elements의 실제 동작과 동일한지, 3) HasDraftEntity=true인데 Draft가 타 사용자 소유일 때 IsActiveEntity=false 바인딩 결과, 4) Detail view에서 HasDraftEntity를 oCtx.getProperty()로 읽을 때 에 포함 필요 여부

## Raw output

```text
결론: `HasDraftEntity=true`이면 `Edit()`를 다시 호출하지 않고 기존 draft로 이동하는 방향은 맞습니다. 단, “내 draft인지 / 타 사용자 draft인지”를 구분해야 합니다.

1. **`HasDraftEntity=true` → `IsActiveEntity=false` 직접 navTo**
   - **내 draft가 이미 존재하는 경우**: 올바른 패턴입니다. `Edit(preserve_changes=true)`는 기존 draft가 있으면 새 draft를 만들지 않고 거절될 수 있습니다. SAP RAP 문서도 Fiori Elements의 Edit는 `preserve_changes=true`로 호출된다고 설명합니다. 기존 draft가 있으면 Edit를 재호출하는 대신 draft 인스턴스(`/Entity(...,IsActiveEntity=false)`)로 들어가는 것이 자연스럽습니다.
   - **draft가 없는 경우**: 직접 `IsActiveEntity=false`로 가면 안 됩니다. 이때는 `Edit()`가 draft를 생성해야 합니다.

2. **Fiori Elements 실제 동작과 동일한가**
   - 큰 흐름은 동일합니다. Fiori Elements는 draft-enabled 앱에서 active object의 Edit 시 `Edit` action을 호출하고, draft가 있으면 draft flow로 이어집니다.
   - 하지만 extension에서 구현할 때는 FE 내부 `editFlow`와 완전히 같은 수준의 UX 처리를 자동으로 얻는 것은 아닙니다. 예를 들어 lock message, draft owner warning, busy state, side effects, routing state 같은 처리는 직접 신경 써야 합니다.
   - 가능하면 freestyle 직접 action 호출보다 `sap.fe.core.controllerextensions.EditFlow` 기반 API를 쓰는 쪽이 FE 표준에 가깝습니다.

3. **`HasDraftEntity=true`인데 draft가 타 사용자 소유일 때**
   - exclusive draft 기준으로는 “편집 가능 draft로 진입”하면 안 됩니다.
   - `IsActiveEntity=false` 바인딩을 시도하면 서비스/권한/구현에 따라 `404`, `403`, 또는 lock 관련 오류가 날 수 있고, 정상 editable context를 기대하면 안 됩니다.
   - SAP Fiori draft guideline도 타 사용자 draft는 `Locked by Another User` 또는 lock 만료 후 `Unsaved Changes by Another User` 상태로 취급합니다.
   - 따라서 `HasDraftEntity`만으로 navTo하면 불충분합니다. 가능하면 `DraftAdministrativeData/InProcessByUser`, `DraftAdministrativeData/LastChangedByUser` 등을 읽어서:
     - 내 draft: inactive draft로 이동
     - 타 사용자 lock: 메시지 표시, active display 유지
     - lock 만료/인계 정책이 필요한 경우: backend 정책에 맞는 takeover/discard/resume 흐름 사용

4. **Detail view에서 `oCtx.getProperty("HasDraftEntity")`로 읽을 때 `$select` 포함 필요 여부**
   - 네. UI에 바인딩되어 자동 선택되지 않는다면 `$select`에 포함해야 합니다.
   - OData V4 model에서 `autoExpandSelect=true`이면 화면에 필요한 필드만 요청합니다. 컨트롤에 바인딩되지 않은 필드를 controller에서 `getProperty()`로만 읽는 경우, 응답에 없어서 `undefined`가 나올 수 있습니다.
   - 권장: ObjectPage/detail context binding 또는 manifest route/binding 설정에 `HasDraftEntity`, 필요 시 `DraftAdministrativeData` expand/select를 명시하세요. 비동기 접근은 `requestProperty("HasDraftEntity")`가 더 안전합니다.

실무 판정은 이렇습니다: `HasDraftEntity=true`면 무조건 inactive로 보내는 것이 아니라, **내 draft일 때만 inactive draft로 navTo**하세요. 타 사용자 draft는 lock 상태로 처리해야 423을 “우회”하는 것이 아니라 RAP/Fiori draft 모델에 맞게 해결하는 방식이 됩니다.

근거: SAP RAP draft edit action은 `preserve_changes=true`에서 기존 draft가 있으면 거절될 수 있고, Fiori Elements Edit는 이 값을 true로 보냅니다. SAPUI5/Fiori Elements 문서는 draft가 lock 메커니즘이며 `editFlow`가 OData V4 draft handling의 주 API라고 설명합니다.  
Sources: [RAP Creating Draft Data](https://help.sap.com/docs/abap-cloud/abap-rap/creating-draft-data), [SAPUI5 Draft Handling](https://help.sap.com/docs/SAPUI5/b2f662dd9d7a4ec680056733050b4d34/ed9aa41c563a44b18701529c8327db4d.html), [auto-$expand/$select](https://help.sap.com/docs/SAPUI5/285985e9cf204697aee91214fc19d95c/10ca58b701414f7f93cd97156f898f80.html).


OpenAI Codex v0.134.0
--------
workdir: C:\Users\pc\Desktop\fiori-main\SAP-Project_CL3\cl3_3_fi_project_0007
model: gpt-5.5
provider: openai
approval: never
sandbox: danger-full-access
reasoning effort: medium
reasoning summaries: none
session id: 019e873b-93ec-7b03-899f-646b03452e00
--------
user
SAP RAP OData V4 Draft 423 Lock 근본 해결. 상황: PreserveChanges=true로도 Edit() 액션이 423 반환. 원인: 동일 자산에 Fiori Elements 배포환경에서 생성된 Draft가 존재해 Lock 유지. 해결책 검토: 1) onEdit() 함수에서 HasDraftEntity=true 확인 → Edit 액션 호출 없이 IsActiveEntity=false로 직접 navTo하는 패턴의 올바름 여부, 2) 이 방식이 Fiori Elements의 실제 동작과 동일한지, 3) HasDraftEntity=true인데 Draft가 타 사용자 소유일 때 IsActiveEntity=false 바인딩 결과, 4) Detail view에서 HasDraftEntity를 oCtx.getProperty()로 읽을 때 에 포함 필요 여부
codex
SAP RAP/Fiori Elements draft 동작은 세부 규칙이 중요해서, 먼저 공식 문서와 관련 근거를 확인한 뒤 각 해결책을 판정하겠습니다.
web search: 
web search: SAP Fiori elements OData V4 draft HasDraftEntity IsActiveEntity Edit action PreserveChanges 423 Locked official documentation
web search: 
web search: SAPUI5 OData V4 getProperty property not selected $select error official documentation autoExpandSelect
web search: 
web search: SAP Fiori elements OData V4 editFlow edit draft Edit action preserveChanges official documentation
web search: 
web search: https://help.sap.com/docs/ABAP_PLATFORM_NEW/468a97775123488ab3345a0c48cadd8f/8665847a17a14e1abdcebe3e235c8c68.html
web search: 
web search: SAP Fiori draft unsaved changes by another user HasDraftEntity InProcessByUser official
codex
결론: `HasDraftEntity=true`이면 `Edit()`를 다시 호출하지 않고 기존 draft로 이동하는 방향은 맞습니다. 단, “내 draft인지 / 타 사용자 draft인지”를 구분해야 합니다.

1. **`HasDraftEntity=true` → `IsActiveEntity=false` 직접 navTo**
   - **내 draft가 이미 존재하는 경우**: 올바른 패턴입니다. `Edit(preserve_changes=true)`는 기존 draft가 있으면 새 draft를 만들지 않고 거절될 수 있습니다. SAP RAP 문서도 Fiori Elements의 Edit는 `preserve_changes=true`로 호출된다고 설명합니다. 기존 draft가 있으면 Edit를 재호출하는 대신 draft 인스턴스(`/Entity(...,IsActiveEntity=false)`)로 들어가는 것이 자연스럽습니다.
   - **draft가 없는 경우**: 직접 `IsActiveEntity=false`로 가면 안 됩니다. 이때는 `Edit()`가 draft를 생성해야 합니다.

2. **Fiori Elements 실제 동작과 동일한가**
   - 큰 흐름은 동일합니다. Fiori Elements는 draft-enabled 앱에서 active object의 Edit 시 `Edit` action을 호출하고, draft가 있으면 draft flow로 이어집니다.
   - 하지만 extension에서 구현할 때는 FE 내부 `editFlow`와 완전히 같은 수준의 UX 처리를 자동으로 얻는 것은 아닙니다. 예를 들어 lock message, draft owner warning, busy state, side effects, routing state 같은 처리는 직접 신경 써야 합니다.
   - 가능하면 freestyle 직접 action 호출보다 `sap.fe.core.controllerextensions.EditFlow` 기반 API를 쓰는 쪽이 FE 표준에 가깝습니다.

3. **`HasDraftEntity=true`인데 draft가 타 사용자 소유일 때**
   - exclusive draft 기준으로는 “편집 가능 draft로 진입”하면 안 됩니다.
   - `IsActiveEntity=false` 바인딩을 시도하면 서비스/권한/구현에 따라 `404`, `403`, 또는 lock 관련 오류가 날 수 있고, 정상 editable context를 기대하면 안 됩니다.
   - SAP Fiori draft guideline도 타 사용자 draft는 `Locked by Another User` 또는 lock 만료 후 `Unsaved Changes by Another User` 상태로 취급합니다.
   - 따라서 `HasDraftEntity`만으로 navTo하면 불충분합니다. 가능하면 `DraftAdministrativeData/InProcessByUser`, `DraftAdministrativeData/LastChangedByUser` 등을 읽어서:
     - 내 draft: inactive draft로 이동
     - 타 사용자 lock: 메시지 표시, active display 유지
     - lock 만료/인계 정책이 필요한 경우: backend 정책에 맞는 takeover/discard/resume 흐름 사용

4. **Detail view에서 `oCtx.getProperty("HasDraftEntity")`로 읽을 때 `$select` 포함 필요 여부**
   - 네. UI에 바인딩되어 자동 선택되지 않는다면 `$select`에 포함해야 합니다.
   - OData V4 model에서 `autoExpandSelect=true`이면 화면에 필요한 필드만 요청합니다. 컨트롤에 바인딩되지 않은 필드를 controller에서 `getProperty()`로만 읽는 경우, 응답에 없어서 `undefined`가 나올 수 있습니다.
   - 권장: ObjectPage/detail context binding 또는 manifest route/binding 설정에 `HasDraftEntity`, 필요 시 `DraftAdministrativeData` expand/select를 명시하세요. 비동기 접근은 `requestProperty("HasDraftEntity")`가 더 안전합니다.

실무 판정은 이렇습니다: `HasDraftEntity=true`면 무조건 inactive로 보내는 것이 아니라, **내 draft일 때만 inactive draft로 navTo**하세요. 타 사용자 draft는 lock 상태로 처리해야 423을 “우회”하는 것이 아니라 RAP/Fiori draft 모델에 맞게 해결하는 방식이 됩니다.

근거: SAP RAP draft edit action은 `preserve_changes=true`에서 기존 draft가 있으면 거절될 수 있고, Fiori Elements Edit는 이 값을 true로 보냅니다. SAPUI5/Fiori Elements 문서는 draft가 lock 메커니즘이며 `editFlow`가 OData V4 draft handling의 주 API라고 설명합니다.  
Sources: [RAP Creating Draft Data](https://help.sap.com/docs/abap-cloud/abap-rap/creating-draft-data), [SAPUI5 Draft Handling](https://help.sap.com/docs/SAPUI5/b2f662dd9d7a4ec680056733050b4d34/ed9aa41c563a44b18701529c8327db4d.html), [auto-$expand/$select](https://help.sap.com/docs/SAPUI5/285985e9cf204697aee91214fc19d95c/10ca58b701414f7f93cd97156f898f80.html).
tokens used
40,923

```

## Concise summary

Provider completed successfully. Review the raw output for details.

## Action items

- Review the response and extract decisions you want to apply.
- Capture follow-up implementation tasks if needed.
