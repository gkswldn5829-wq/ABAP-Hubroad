# codex advisor artifact

- Provider: codex
- Exit code: 0
- Created at: 2026-06-02T07:26:33.036Z

## Original task

SAP RAP OData V4 Draft Edit action PreserveChanges parameter 차이 분석. 상황: UI5 Freestyle 앱에서 Edit(...) 액션 호출 시 HTTP 423 Lock 에러. Fiori Elements에서는 정상 동작. 원인: PreserveChanges=false로 호출 시 기존 Draft 삭제 시도 → 타 세션 Lock → 423. PreserveChanges=true로 변경 시 기존 Draft 재사용으로 해결 예상. 1) PreserveChanges=true/false의 정확한 RAP 백엔드 동작 차이, 2) Fiori Elements가 실제로 어떤 값으로 호출하는지, 3) PreserveChanges=true 사용 시 주의사항이나 부작용, 4) Edit 액션 후 반환된 Draft Context로 화면 전환하는 올바른 SAPUI5 OData V4 패턴

## Final prompt

SAP RAP OData V4 Draft Edit action PreserveChanges parameter 차이 분석. 상황: UI5 Freestyle 앱에서 Edit(...) 액션 호출 시 HTTP 423 Lock 에러. Fiori Elements에서는 정상 동작. 원인: PreserveChanges=false로 호출 시 기존 Draft 삭제 시도 → 타 세션 Lock → 423. PreserveChanges=true로 변경 시 기존 Draft 재사용으로 해결 예상. 1) PreserveChanges=true/false의 정확한 RAP 백엔드 동작 차이, 2) Fiori Elements가 실제로 어떤 값으로 호출하는지, 3) PreserveChanges=true 사용 시 주의사항이나 부작용, 4) Edit 액션 후 반환된 Draft Context로 화면 전환하는 올바른 SAPUI5 OData V4 패턴

## Raw output

```text
정리하면, 원인 분석 방향은 맞지만 표현을 조금 고쳐야 합니다. `PreserveChanges=true`는 RAP 백엔드 표준 의미상 “기존 Draft를 재사용”이라기보다 “기존 Draft 변경분을 덮어쓰지 않음”입니다. Fiori elements는 이 값을 `true`로 호출하고, 실패 응답이나 sibling draft context를 처리하는 추가 플로우까지 갖고 있어서 Freestyle 단순 호출과 다르게 보일 수 있습니다.

**1. `PreserveChanges` 차이**

`PreserveChanges=true`:
- Active instance에 대해 EditAction 실행 시 기존 draft가 있으면 그 draft 변경분을 보존합니다.
- RAP 문서 기준으로는 기존 draft가 있으면 Edit 요청이 reject될 수 있습니다.
- 즉 “덮어쓰기 금지”입니다.
- 기존 draft가 본인 draft이면 UI 쪽에서 draft sibling context로 전환해 이어서 편집하는 플로우가 필요합니다.
- 타 사용자 draft가 lock 중이면 `423 Locked` 또는 충돌성 응답을 처리해야 합니다.

`PreserveChanges=false`:
- 기본값입니다.
- Active 데이터를 draft table로 다시 복사하면서 기존 draft를 active 값으로 덮어쓰는 플로우입니다.
- 기존 draft 변경사항이 사라질 수 있습니다.
- 기존 draft가 타 세션/타 사용자에 의해 lock되어 있으면 삭제/overwrite 과정에서 `423 Locked`가 발생할 수 있습니다.

SAP RAP 문서도 `false`에서는 기존 draft가 active data 값으로 overwrite되어 기존 draft 변경을 잃을 수 있으므로 parameter를 명시하라고 설명합니다. SAP Help: https://help.sap.com/docs/abap-cloud/abap-rap/creating-draft-data

**2. Fiori elements는 어떤 값으로 호출하나**

Fiori elements OData V4의 Edit 플로우는 기본적으로 `PreserveChanges=true`입니다. SAPUI5 `sap.fe.core` 소스에서도 `bPreserveChanges`가 없으면 default true로 처리되고, EditAction parameter로 `PreserveChanges`를 설정합니다.

참고:
- SAPUI5 draft handling: https://help.sap.com/docs/SAPUI5/d625376e710e40cb9d40e43e1b02933b/ed9aa41c563a44b18701529c8327db4d.html
- SAPUI5 FE source reference: https://app.unpkg.com/%40sapui5/sap.fe.core%401.142.0/files/src/sap/fe/core/controllerextensions/editFlow/draft.ts

**3. `PreserveChanges=true` 주의사항**

`true`로 바꾸면 기존 draft를 강제로 초기화하지 않으므로 데이터 손실 위험은 줄어듭니다. 대신 다음을 처리해야 합니다.

- 기존 draft가 있으면 EditAction이 바로 새 draft context를 주지 않고 error를 줄 수 있습니다.
- 본인 draft가 이미 있으면 active context가 아니라 draft sibling context로 화면을 전환해야 합니다.
- 타 사용자 draft가 lock 중이면 편집 불가 메시지를 보여줘야 합니다.
- 사용자가 “기존 draft 폐기 후 새로 편집”을 선택하는 UX가 필요하다면 별도로 discard 후 edit 또는 `false` overwrite 플로우를 명시적으로 제공해야 합니다.
- `PreserveChanges=false`는 데이터 손실 가능성이 있으므로 일반 Edit 버튼 기본값으로는 피하는 게 맞습니다.

**4. SAPUI5 OData V4 Freestyle 패턴**

권장 패턴은 bound action을 deferred operation으로 만들고, `PreserveChanges=true`를 setParameter 한 뒤, 반환된 draft context로 view binding을 교체하는 방식입니다.

```js
async onEdit() {
  const oView = this.getView();
  const oActiveContext = oView.getBindingContext();
  const oModel = oActiveContext.getModel();
  const oMetaModel = oModel.getMetaModel();

  const sMetaPath = oMetaModel.getMetaPath(oActiveContext.getPath());
  const sEditAction = oMetaModel.getObject(
    `${sMetaPath}@com.sap.vocabularies.Common.v1.DraftRoot/EditAction`
  );

  const oEditBinding = oModel.bindContext(
    `${sEditAction}(...)`,
    oActiveContext,
    { $$inheritExpandSelect: true, $$updateGroupId: "$auto" }
  );

  oEditBinding.setParameter("PreserveChanges", true);

  try {
    const oDraftContext = await oEditBinding.invoke(
      "$auto",
      false,
      null,
      true // replaceWithRVC
    );

    oView.setBindingContext(oDraftContext);
  } catch (oError) {
    if (oError.status === 423) {
      // locked by another user/session
      sap.m.MessageBox.error(oError.message);
      return;
    }

    if (oError.status === 409) {
      // existing draft conflict: fetch/use sibling draft if your app supports resume flow
      sap.m.MessageBox.error(oError.message);
      return;
    }

    throw oError;
  }
}
```

핵심은 EditAction 호출 후 active context path를 계속 쓰면 안 된다는 점입니다. 반환된 context는 보통 `IsActiveEntity=false`인 draft instance입니다. 화면은 이 draft context로 `setBindingContext` 하거나, 라우팅 기반이면 반환 context의 path/canonical path에서 draft key를 사용해 draft route로 이동해야 합니다.

SAPUI5 공식 OData V4 문서도 bound action 결과가 다른 버전의 entity, 예를 들어 active에서 draft로 바뀌는 경우 object page binding context를 return value context로 교체하는 패턴을 설명합니다: https://help.sap.com/docs/SAPUI5/3f47ec0c79a547aeaa23090b74c9520c/b54f7895b7594c61a83fa7257fa9d13f.html?locale=en-US&state=PRODUCTION&version=1.120


OpenAI Codex v0.134.0
--------
workdir: C:\Users\pc\Desktop\fiori-main\SAP-Project_CL3\cl3_3_fi_project_0007
model: gpt-5.5
provider: openai
approval: never
sandbox: danger-full-access
reasoning effort: medium
reasoning summaries: none
session id: 019e8738-bfaf-7ed1-bc6b-288881a301e9
--------
user
SAP RAP OData V4 Draft Edit action PreserveChanges parameter 차이 분석. 상황: UI5 Freestyle 앱에서 Edit(...) 액션 호출 시 HTTP 423 Lock 에러. Fiori Elements에서는 정상 동작. 원인: PreserveChanges=false로 호출 시 기존 Draft 삭제 시도 → 타 세션 Lock → 423. PreserveChanges=true로 변경 시 기존 Draft 재사용으로 해결 예상. 1) PreserveChanges=true/false의 정확한 RAP 백엔드 동작 차이, 2) Fiori Elements가 실제로 어떤 값으로 호출하는지, 3) PreserveChanges=true 사용 시 주의사항이나 부작용, 4) Edit 액션 후 반환된 Draft Context로 화면 전환하는 올바른 SAPUI5 OData V4 패턴
codex
SAP RAP와 UI5 OData V4 동작은 버전별 구현 차이가 있을 수 있어서, 먼저 공식 문서와 SAP 공개 자료 기준으로 확인한 뒤 정리하겠습니다.
web search: 
web search: SAP RAP OData V4 draft Edit PreserveChanges parameter official documentation
web search: 
web search: https://help.sap.com/docs/abap-cloud/abap-rap/creating-draft-data
web search: 
web search: "PreserveChanges" "SAP Fiori elements"
web search: 
web search: 
web search: 
web search: site:github.com/SAP/openui5 "PreserveChanges" "editDocument"
web search: 
web search: 
web search: 
web search: https://unpkg.com/@sapui5/sap.fe.core@1.142.0/src/sap/fe/core/controllerextensions/editFlow/draft.ts
web search: 
web search: SAPUI5 OData V4 action bindContext execute setParameter official documentation
web search: 
web search: https://help.sap.com/docs/SAPUI5/3f47ec0c79a547aeaa23090b74c9520c/b54f7895b7594c61a83fa7257fa9d13f.html?locale=en-US&state=PRODUCTION&version=1.120
mcp: context7/resolve-library-id started
mcp: context7/resolve-library-id (completed)
mcp: context7/query-docs started
mcp: context7/query-docs (completed)
codex
확인한 핵심은 하나입니다. `PreserveChanges=true`가 “항상 기존 Draft를 재사용한다”는 뜻은 아니고, RAP 표준 의미는 “기존 Draft 변경을 보존하라, 즉 덮어쓰지 말라”입니다. Fiori elements는 이 값을 `true`로 먼저 호출하고, 실패 응답/형제 Draft 컨텍스트 처리까지 포함한 상위 플로우로 동작합니다.
codex
정리하면, 원인 분석 방향은 맞지만 표현을 조금 고쳐야 합니다. `PreserveChanges=true`는 RAP 백엔드 표준 의미상 “기존 Draft를 재사용”이라기보다 “기존 Draft 변경분을 덮어쓰지 않음”입니다. Fiori elements는 이 값을 `true`로 호출하고, 실패 응답이나 sibling draft context를 처리하는 추가 플로우까지 갖고 있어서 Freestyle 단순 호출과 다르게 보일 수 있습니다.

**1. `PreserveChanges` 차이**

`PreserveChanges=true`:
- Active instance에 대해 EditAction 실행 시 기존 draft가 있으면 그 draft 변경분을 보존합니다.
- RAP 문서 기준으로는 기존 draft가 있으면 Edit 요청이 reject될 수 있습니다.
- 즉 “덮어쓰기 금지”입니다.
- 기존 draft가 본인 draft이면 UI 쪽에서 draft sibling context로 전환해 이어서 편집하는 플로우가 필요합니다.
- 타 사용자 draft가 lock 중이면 `423 Locked` 또는 충돌성 응답을 처리해야 합니다.

`PreserveChanges=false`:
- 기본값입니다.
- Active 데이터를 draft table로 다시 복사하면서 기존 draft를 active 값으로 덮어쓰는 플로우입니다.
- 기존 draft 변경사항이 사라질 수 있습니다.
- 기존 draft가 타 세션/타 사용자에 의해 lock되어 있으면 삭제/overwrite 과정에서 `423 Locked`가 발생할 수 있습니다.

SAP RAP 문서도 `false`에서는 기존 draft가 active data 값으로 overwrite되어 기존 draft 변경을 잃을 수 있으므로 parameter를 명시하라고 설명합니다. SAP Help: https://help.sap.com/docs/abap-cloud/abap-rap/creating-draft-data

**2. Fiori elements는 어떤 값으로 호출하나**

Fiori elements OData V4의 Edit 플로우는 기본적으로 `PreserveChanges=true`입니다. SAPUI5 `sap.fe.core` 소스에서도 `bPreserveChanges`가 없으면 default true로 처리되고, EditAction parameter로 `PreserveChanges`를 설정합니다.

참고:
- SAPUI5 draft handling: https://help.sap.com/docs/SAPUI5/d625376e710e40cb9d40e43e1b02933b/ed9aa41c563a44b18701529c8327db4d.html
- SAPUI5 FE source reference: https://app.unpkg.com/%40sapui5/sap.fe.core%401.142.0/files/src/sap/fe/core/controllerextensions/editFlow/draft.ts

**3. `PreserveChanges=true` 주의사항**

`true`로 바꾸면 기존 draft를 강제로 초기화하지 않으므로 데이터 손실 위험은 줄어듭니다. 대신 다음을 처리해야 합니다.

- 기존 draft가 있으면 EditAction이 바로 새 draft context를 주지 않고 error를 줄 수 있습니다.
- 본인 draft가 이미 있으면 active context가 아니라 draft sibling context로 화면을 전환해야 합니다.
- 타 사용자 draft가 lock 중이면 편집 불가 메시지를 보여줘야 합니다.
- 사용자가 “기존 draft 폐기 후 새로 편집”을 선택하는 UX가 필요하다면 별도로 discard 후 edit 또는 `false` overwrite 플로우를 명시적으로 제공해야 합니다.
- `PreserveChanges=false`는 데이터 손실 가능성이 있으므로 일반 Edit 버튼 기본값으로는 피하는 게 맞습니다.

**4. SAPUI5 OData V4 Freestyle 패턴**

권장 패턴은 bound action을 deferred operation으로 만들고, `PreserveChanges=true`를 setParameter 한 뒤, 반환된 draft context로 view binding을 교체하는 방식입니다.

```js
async onEdit() {
  const oView = this.getView();
  const oActiveContext = oView.getBindingContext();
  const oModel = oActiveContext.getModel();
  const oMetaModel = oModel.getMetaModel();

  const sMetaPath = oMetaModel.getMetaPath(oActiveContext.getPath());
  const sEditAction = oMetaModel.getObject(
    `${sMetaPath}@com.sap.vocabularies.Common.v1.DraftRoot/EditAction`
  );

  const oEditBinding = oModel.bindContext(
    `${sEditAction}(...)`,
    oActiveContext,
    { $$inheritExpandSelect: true, $$updateGroupId: "$auto" }
  );

  oEditBinding.setParameter("PreserveChanges", true);

  try {
    const oDraftContext = await oEditBinding.invoke(
      "$auto",
      false,
      null,
      true // replaceWithRVC
    );

    oView.setBindingContext(oDraftContext);
  } catch (oError) {
    if (oError.status === 423) {
      // locked by another user/session
      sap.m.MessageBox.error(oError.message);
      return;
    }

    if (oError.status === 409) {
      // existing draft conflict: fetch/use sibling draft if your app supports resume flow
      sap.m.MessageBox.error(oError.message);
      return;
    }

    throw oError;
  }
}
```

핵심은 EditAction 호출 후 active context path를 계속 쓰면 안 된다는 점입니다. 반환된 context는 보통 `IsActiveEntity=false`인 draft instance입니다. 화면은 이 draft context로 `setBindingContext` 하거나, 라우팅 기반이면 반환 context의 path/canonical path에서 draft key를 사용해 draft route로 이동해야 합니다.

SAPUI5 공식 OData V4 문서도 bound action 결과가 다른 버전의 entity, 예를 들어 active에서 draft로 바뀌는 경우 object page binding context를 return value context로 교체하는 패턴을 설명합니다: https://help.sap.com/docs/SAPUI5/3f47ec0c79a547aeaa23090b74c9520c/b54f7895b7594c61a83fa7257fa9d13f.html?locale=en-US&state=PRODUCTION&version=1.120
tokens used
70,205

```

## Concise summary

Provider completed successfully. Review the raw output for details.

## Action items

- Review the response and extract decisions you want to apply.
- Capture follow-up implementation tasks if needed.
