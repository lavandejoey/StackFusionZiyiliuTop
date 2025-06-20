// /StackFusionZiyiliuTop/backend/src/common/util/validators.ts
/******************************************************************************
 Functions
 ******************************************************************************/
export const isUuidV4 = (v: string) =>
    /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(v);
