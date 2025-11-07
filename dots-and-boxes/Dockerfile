# Node 22 LTS (Debian 기반)
FROM node:22-slim

# 컨테이너 내부 작업 디렉토리
WORKDIR /app

# npm log 출력 줄이기
ENV NPM_CONFIG_LOGLEVEL warn

# 포트 설정 (Vite 기본 포트)
EXPOSE 5173

# 기본 명령어: Vite 개발 서버 실행
CMD ["npm", "run", "dev", "--", "--host"]
