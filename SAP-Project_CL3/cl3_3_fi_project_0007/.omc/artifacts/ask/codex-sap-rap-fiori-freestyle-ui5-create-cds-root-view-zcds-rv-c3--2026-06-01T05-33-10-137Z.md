# codex advisor artifact

- Provider: codex
- Exit code: 0
- Created at: 2026-06-01T05:33:10.138Z

## Original task

SAP RAP Fiori freestyle UI5 앱의 드래프트 Create 화면 구현 분석. 백엔드 정보: CDS Root View ZCDS_RV_C3_FI_0005(ztc3fi0021 기반). 필수 필드: Bukrs(회사코드), Anlnr(자산번호), Anltx(자산명칭), Anlkl(자산분류), Waers(통화), Afamid(상각방법). get_instance_features에서 전표번호 있으면 delete 비활성화. depreciate/dispose는 draft모드(%is_draft=on)에서 차단. validateDepMethod로 Afamid 00/01/02만 허용. calculateBookValue가 Bchwrt=Anschw-Kansw 자동계산. setAdminFields가 Erdat/Aedat 자동세팅. oBinding.create({Bukrs:'1000',Waers:'KRW'}) 이후 created() Promise로 Anlnr 확정 후 네비게이션. 질문: 1) Create 시 최소 필수 전달 필드는? 2) IsActiveEntity=false 바인딩 경로 구성법? 3) 드래프트 모드에서 액션버튼 비활성화 UI 처리법? 4) OData V4 DraftIndicator 패턴? 간결하게 답변

## Final prompt

SAP RAP Fiori freestyle UI5 앱의 드래프트 Create 화면 구현 분석. 백엔드 정보: CDS Root View ZCDS_RV_C3_FI_0005(ztc3fi0021 기반). 필수 필드: Bukrs(회사코드), Anlnr(자산번호), Anltx(자산명칭), Anlkl(자산분류), Waers(통화), Afamid(상각방법). get_instance_features에서 전표번호 있으면 delete 비활성화. depreciate/dispose는 draft모드(%is_draft=on)에서 차단. validateDepMethod로 Afamid 00/01/02만 허용. calculateBookValue가 Bchwrt=Anschw-Kansw 자동계산. setAdminFields가 Erdat/Aedat 자동세팅. oBinding.create({Bukrs:'1000',Waers:'KRW'}) 이후 created() Promise로 Anlnr 확정 후 네비게이션. 질문: 1) Create 시 최소 필수 전달 필드는? 2) IsActiveEntity=false 바인딩 경로 구성법? 3) 드래프트 모드에서 액션버튼 비활성화 UI 처리법? 4) OData V4 DraftIndicator 패턴? 간결하게 답변

## Raw output

```text
1. **Create 시 최소 필수 전달 필드**

초기 `create()`에는 백엔드 필수값 중 화면에서 즉시 확정 가능한 값만 넘기면 됩니다.

```js
oBinding.create({
  Bukrs: "1000",
  Waers: "KRW"
});
```

다만 저장 전에는 RAP validation 기준으로 최소 아래 값들이 채워져야 합니다.

```text
Bukrs   회사코드
Anlnr   자산번호
Anltx   자산명칭
Anlkl   자산분류
Waers   통화
Afamid  상각방법: 00 / 01 / 02
```

`Anlnr`가 백엔드에서 생성/확정되는 구조라면 `created()` 이후 확정값을 읽어서 경로를 갱신하거나 Object Page로 이동하는 방식이 맞습니다.

2. **`IsActiveEntity=false` 바인딩 경로 구성법**

OData V4 RAP Draft 엔티티는 draft row를 직접 바인딩할 때 key predicate에 `IsActiveEntity=false`를 포함합니다.

예시:

```js
const sPath =
  `/ZCDS_RV_C3_FI_0005(Bukrs='1000',Anlnr='${sAnlnr}',IsActiveEntity=false)`;

this.getView().bindElement({
  path: sPath
});
```

복합키라면 실제 서비스 메타데이터의 key 전체를 포함해야 합니다. Draft create 직후에는 직접 문자열 조립보다 `created()` 후 context path를 쓰는 쪽이 안전합니다.

```js
const oContext = oListBinding.create({ Bukrs: "1000", Waers: "KRW" });

oContext.created().then(() => {
  const sDraftPath = oContext.getPath();
  this.getView().bindElement({ path: sDraftPath });
});
```

3. **드래프트 모드에서 액션버튼 비활성화 UI 처리법**

`depreciate`, `dispose`가 `%is_draft = on`에서 차단되므로 UI에서도 draft 상태일 때 비활성화합니다.

```xml
<Button
  text="Depreciate"
  press=".onDepreciate"
  enabled="{= ${IsActiveEntity} === true }" />

<Button
  text="Dispose"
  press=".onDispose"
  enabled="{= ${IsActiveEntity} === true }" />
```

삭제 버튼은 backend `get_instance_features`에서 전표번호 존재 시 비활성화되므로, 가능하면 operation availability / feature control 결과를 바인딩해서 처리하고, 보조적으로 전표번호 조건을 UI에 반영합니다.

```xml
<Button
  text="Delete"
  enabled="{= !${Belnr} }"
  press=".onDelete" />
```

핵심은 **UI 비활성화는 UX용**, 최종 차단은 RAP behavior에서 유지하는 것입니다.

4. **OData V4 DraftIndicator 패턴**

Freestyle UI5에서는 보통 `sap.m.DraftIndicator`를 화면 상단 또는 Object Page header 근처에 두고 OData V4 draft lifecycle 이벤트와 연결합니다.

```xml
<DraftIndicator id="draftIndicator" />
```

컨트롤러에서 변경 감지 시 상태 갱신:

```js
const oDraftIndicator = this.byId("draftIndicator");

oDraftIndicator.showDraftSaving();

oModel.submitBatch("$auto").then(() => {
  oDraftIndicator.showDraftSaved();
}).catch(() => {
  oDraftIndicator.clearDraftState();
});
```

일반 패턴은 다음 흐름입니다.

```text
create draft
→ bind IsActiveEntity=false context
→ user edits fields
→ PATCH 자동 전송 또는 submitBatch
→ DraftIndicator: Saving...
→ 성공 시 Saved
→ Activate 시 active entity로 navigation
```

Create 화면에서는 `oBinding.create({ Bukrs: "1000", Waers: "KRW" })` 후 `created()` Promise에서 draft context 또는 확정된 `Anlnr` 기준으로 다시 바인딩/네비게이션하는 구조가 적절합니다.


OpenAI Codex v0.134.0
--------
workdir: C:\Users\pc\Desktop\fiori-main\SAP-Project_CL3\cl3_3_fi_project_0007
model: gpt-5.5
provider: openai
approval: never
sandbox: danger-full-access
reasoning effort: medium
reasoning summaries: none
session id: 019e81ab-89ca-75b1-925d-79eaa2a86b39
--------
user
SAP RAP Fiori freestyle UI5 앱의 드래프트 Create 화면 구현 분석. 백엔드 정보: CDS Root View ZCDS_RV_C3_FI_0005(ztc3fi0021 기반). 필수 필드: Bukrs(회사코드), Anlnr(자산번호), Anltx(자산명칭), Anlkl(자산분류), Waers(통화), Afamid(상각방법). get_instance_features에서 전표번호 있으면 delete 비활성화. depreciate/dispose는 draft모드(%is_draft=on)에서 차단. validateDepMethod로 Afamid 00/01/02만 허용. calculateBookValue가 Bchwrt=Anschw-Kansw 자동계산. setAdminFields가 Erdat/Aedat 자동세팅. oBinding.create({Bukrs:'1000',Waers:'KRW'}) 이후 created() Promise로 Anlnr 확정 후 네비게이션. 질문: 1) Create 시 최소 필수 전달 필드는? 2) IsActiveEntity=false 바인딩 경로 구성법? 3) 드래프트 모드에서 액션버튼 비활성화 UI 처리법? 4) OData V4 DraftIndicator 패턴? 간결하게 답변
codex
1. **Create 시 최소 필수 전달 필드**

초기 `create()`에는 백엔드 필수값 중 화면에서 즉시 확정 가능한 값만 넘기면 됩니다.

```js
oBinding.create({
  Bukrs: "1000",
  Waers: "KRW"
});
```

다만 저장 전에는 RAP validation 기준으로 최소 아래 값들이 채워져야 합니다.

```text
Bukrs   회사코드
Anlnr   자산번호
Anltx   자산명칭
Anlkl   자산분류
Waers   통화
Afamid  상각방법: 00 / 01 / 02
```

`Anlnr`가 백엔드에서 생성/확정되는 구조라면 `created()` 이후 확정값을 읽어서 경로를 갱신하거나 Object Page로 이동하는 방식이 맞습니다.

2. **`IsActiveEntity=false` 바인딩 경로 구성법**

OData V4 RAP Draft 엔티티는 draft row를 직접 바인딩할 때 key predicate에 `IsActiveEntity=false`를 포함합니다.

예시:

```js
const sPath =
  `/ZCDS_RV_C3_FI_0005(Bukrs='1000',Anlnr='${sAnlnr}',IsActiveEntity=false)`;

this.getView().bindElement({
  path: sPath
});
```

복합키라면 실제 서비스 메타데이터의 key 전체를 포함해야 합니다. Draft create 직후에는 직접 문자열 조립보다 `created()` 후 context path를 쓰는 쪽이 안전합니다.

```js
const oContext = oListBinding.create({ Bukrs: "1000", Waers: "KRW" });

oContext.created().then(() => {
  const sDraftPath = oContext.getPath();
  this.getView().bindElement({ path: sDraftPath });
});
```

3. **드래프트 모드에서 액션버튼 비활성화 UI 처리법**

`depreciate`, `dispose`가 `%is_draft = on`에서 차단되므로 UI에서도 draft 상태일 때 비활성화합니다.

```xml
<Button
  text="Depreciate"
  press=".onDepreciate"
  enabled="{= ${IsActiveEntity} === true }" />

<Button
  text="Dispose"
  press=".onDispose"
  enabled="{= ${IsActiveEntity} === true }" />
```

삭제 버튼은 backend `get_instance_features`에서 전표번호 존재 시 비활성화되므로, 가능하면 operation availability / feature control 결과를 바인딩해서 처리하고, 보조적으로 전표번호 조건을 UI에 반영합니다.

```xml
<Button
  text="Delete"
  enabled="{= !${Belnr} }"
  press=".onDelete" />
```

핵심은 **UI 비활성화는 UX용**, 최종 차단은 RAP behavior에서 유지하는 것입니다.

4. **OData V4 DraftIndicator 패턴**

Freestyle UI5에서는 보통 `sap.m.DraftIndicator`를 화면 상단 또는 Object Page header 근처에 두고 OData V4 draft lifecycle 이벤트와 연결합니다.

```xml
<DraftIndicator id="draftIndicator" />
```

컨트롤러에서 변경 감지 시 상태 갱신:

```js
const oDraftIndicator = this.byId("draftIndicator");

oDraftIndicator.showDraftSaving();

oModel.submitBatch("$auto").then(() => {
  oDraftIndicator.showDraftSaved();
}).catch(() => {
  oDraftIndicator.clearDraftState();
});
```

일반 패턴은 다음 흐름입니다.

```text
create draft
→ bind IsActiveEntity=false context
→ user edits fields
→ PATCH 자동 전송 또는 submitBatch
→ DraftIndicator: Saving...
→ 성공 시 Saved
→ Activate 시 active entity로 navigation
```

Create 화면에서는 `oBinding.create({ Bukrs: "1000", Waers: "KRW" })` 후 `created()` Promise에서 draft context 또는 확정된 `Anlnr` 기준으로 다시 바인딩/네비게이션하는 구조가 적절합니다.
tokens used
11,441

```

## Concise summary

Provider completed successfully. Review the raw output for details.

## Action items

- Review the response and extract decisions you want to apply.
- Capture follow-up implementation tasks if needed.
