export default function LoginPage() {
  const handleGoogleLogin = () => {
    window.location.href = `${import.meta.env.VITE_API_URL ?? ''}/api/auth/google`;
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '100vh' }}>
      <h1>VaultDocs</h1>
      <p>셀프 호스팅 문서 관리 서비스</p>
      <button onClick={handleGoogleLogin}>
        Google 로 계속하기
      </button>
    </div>
  );
}
