# TODO: Fix EditCourse.tsx Thumbnail Upload

## Plan approved ✅ - Step-by-step:

✅ **Step 1**: Create TODO.md (current)

**Step 2**: Fix EditCourse.tsx

- Move `thumbnailFile` state inside component
- Add proper `handleSubmit` with FormData/UPDATE logic
- Fix file input onChange (size validation, setThumbnailFile)
- Remove broken code blocks
- Use correct backend field names (`titre`, `duree_estimee`)
- Import `updateFormation`, remove `createFormation`

**Step 3**: Test

- `npm run dev`
- Create course → Edit → Upload image → Save → Refresh (image persists)

**Step 4**: Backend verification\*\* (if needed)

- Check Laravel storage/app/public/formations/miniatures/
- Verify FormationController handles `miniature_fichier`

**Progress**: 1/4 completed
