# 일정 맞추기 (when2meet)

이름 입력 → 오늘부터 3주 안에서 가능한 날짜 클릭 → 저장. 모두의 선택이 달력에 합쳐져 보입니다.

## 1. Supabase 설정
1. https://supabase.com 에서 프로젝트 생성
2. SQL Editor 에 `supabase.sql` 내용 붙여넣고 실행
3. Project Settings > API 에서 `Project URL`, `anon public` 키 복사
4. `config.js` 에 붙여넣기

## 2. GitHub Pages 배포
```bash
git add -A && git commit -m "init"
gh repo create when2meet --public --source=. --push
gh api -X POST repos/{owner}/when2meet/pages -f build_type=legacy -f 'source[branch]=main' -f 'source[path]=/'
```
또는 GitHub 저장소 > Settings > Pages > Branch: main, / (root) 선택.

## 로컬 테스트
```bash
python3 -m http.server 8080
# http://localhost:8080
```

## 설정 (`config.js`)
- `TOTAL_PEOPLE`: 모여야 하는 인원 (기본 5)
- `WEEKS`: 오늘부터 보여줄 주 수 (기본 3)
