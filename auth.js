(() => {
  'use strict';

  let authMode = 'login';
  let currentSessionUserId = null;
  let authBusy = false;
  let nicknameBusy = false;
  let syncStatus = 'idle';
  let syncMessage = '';

  const $ = id => document.getElementById(id);

  function client() {
    return window.CalcDailySupabase?.client || null;
  }

  function configured() {
    return Boolean(
      window.CalcDailySupabase?.configured &&
      client()
    );
  }

  function show(element, visible) {
    if (!element) return;

    element.classList.toggle('hidden', !visible);
  }

  function openModal() {
    const modal = $('accountModal');
    if (!modal) return;

    modal.classList.remove('hidden');
    modal.classList.add('flex');
  }

  function closeModal() {
    const modal = $('accountModal');
    if (!modal) return;

    modal.classList.add('hidden');
    modal.classList.remove('flex');
  }

  function setMessage(message, type = 'neutral') {
    const el = $('authMessage');
    if (!el) return;

    if (!message) {
      el.textContent = '';
      el.classList.add('hidden');
      return;
    }

    el.textContent = message;
    el.classList.remove('hidden');

    el.className =
      'rounded-xl px-3.5 py-3 text-xs leading-5 ' +
      (
        type === 'error'
          ? 'bg-[#fff0ea] text-clay'
          : type === 'success'
            ? 'bg-sageSoft text-sage'
            : 'bg-[#efede8] text-muted'
      );
  }

  function setProfileMessage(message, type = 'neutral') {
    const el = $('profileMessage');
    if (!el) return;

    if (!message) {
      el.textContent = '';
      el.classList.add('hidden');
      return;
    }

    el.textContent = message;
    el.classList.remove('hidden');

    el.className =
      'mt-3 rounded-xl px-3.5 py-3 text-xs leading-5 ' +
      (
        type === 'error'
          ? 'bg-[#fff0ea] text-clay'
          : type === 'success'
            ? 'bg-sageSoft text-sage'
            : 'bg-[#efede8] text-muted'
      );
  }

  function displayNameFor(user) {
    const metadataName = String(
      user?.user_metadata?.display_name || ''
    ).trim();

    if (metadataName) {
      return metadataName;
    }

    return (
      String(user?.email || '').split('@')[0] ||
      'CalcDaily User'
    );
  }

  function setMode(mode) {
    authMode = mode === 'register'
      ? 'register'
      : 'login';

    const loginTab = $('authLoginTab');
    const registerTab = $('authRegisterTab');
    const submit = $('authSubmitBtn');
    const password = $('authPasswordInput');
    const nicknameField = $('authNicknameField');
    const nickname = $('authNicknameInput');

    if (loginTab) {
      loginTab.className =
        'rounded-lg px-3 py-2 text-xs font-medium ' +
        (
          authMode === 'login'
            ? 'bg-white shadow-sm'
            : 'text-muted'
        );
    }

    if (registerTab) {
      registerTab.className =
        'rounded-lg px-3 py-2 text-xs font-medium ' +
        (
          authMode === 'register'
            ? 'bg-white shadow-sm'
            : 'text-muted'
        );
    }

    if (submit) {
      submit.textContent =
        authMode === 'login'
          ? '登录'
          : '创建账号';
    }

    if (password) {
      password.autocomplete =
        authMode === 'login'
          ? 'current-password'
          : 'new-password';
    }

    show(
      nicknameField,
      authMode === 'register'
    );

    if (nickname) {
      nickname.required =
        authMode === 'register';

      if (authMode === 'login') {
        nickname.value = '';
      }
    }

    setMessage('');
  }

  function currentUser() {
    return window.CalcDailyCloud?.getUser?.() || null;
  }

  function syncLabel() {
    if (syncStatus === 'syncing' || syncStatus === 'loading') {
      return syncMessage || '正在同步…';
    }

    if (syncStatus === 'error') {
      return syncMessage
        ? `同步失败：${syncMessage}`
        : '云端同步失败';
    }

    if (syncStatus === 'synced') {
      return syncMessage || '云端已同步';
    }

    return '登录后自动同步学习记录';
  }

  function renderAccountUI() {
    const user = currentUser();
    const isConfigured = configured();

    const title = $('accountStatusTitle');
    const text = $('accountStatusText');
    const dot = $('accountStatusDot');
    const action = $('accountActionBtn');
    const mobile = $('mobileAccountBtn');
    const reset = $('resetDataBtn');

    show($('authConfigNotice'), !isConfigured);
    show($('signedOutPanel'), !user);
    show($('signedInPanel'), Boolean(user));

    if (reset) {
      reset.textContent = user
        ? '清空学习数据'
        : '重置本地数据';

      reset.title = user
        ? '清空当前账号的本机与云端学习记录，不删除账号'
        : '清空当前浏览器中的本地学习记录';
    }

    if (!isConfigured) {
      if (title) title.textContent = '云同步未配置';
      if (text) text.textContent = '填写 Supabase 项目配置后启用';
      if (dot) dot.className =
        'h-2 w-2 shrink-0 rounded-full bg-amber-400';
      if (action) action.textContent = '配置';
      if (mobile) mobile.textContent = '账号';

      return;
    }

    if (!user) {
      if (title) title.textContent = '游客模式';
      if (text) text.textContent = '登录后可跨设备同步学习记录';
      if (dot) dot.className =
        'h-2 w-2 shrink-0 rounded-full bg-[#c9c3ba]';
      if (action) action.textContent = '登录';
      if (mobile) mobile.textContent = '登录';

      return;
    }

    const email = user.email || '已登录';
    const displayName = displayNameFor(user);

    if (title) title.textContent = displayName;
    if (text) text.textContent = syncLabel();

    if (dot) {
      dot.className =
        'h-2 w-2 shrink-0 rounded-full ' +
        (
          syncStatus === 'error'
            ? 'bg-clay'
            : syncStatus === 'syncing' ||
              syncStatus === 'loading'
              ? 'bg-amber-400'
              : 'bg-emerald-500'
        );
    }

    if (action) action.textContent = '账号';
    if (mobile) mobile.textContent = '账号';

    if ($('signedInEmail')) {
      $('signedInEmail').textContent = email;
    }

    if ($('signedInNicknameInput')) {
      const input = $('signedInNicknameInput');

      if (
        document.activeElement !== input &&
        !nicknameBusy
      ) {
        input.value = displayName;
      }
    }

    if ($('signedInSyncText')) {
      $('signedInSyncText').textContent = syncLabel();
    }
  }

  async function pushCloudStateToApp(state) {
    if (!state) return;

    if (window.CalcDailyApp?.applyCloudState) {
      window.CalcDailyApp.applyCloudState(state);
      return;
    }

    window.dispatchEvent(
      new CustomEvent('calcdaily:cloud-state-ready', {
        detail: { state }
      })
    );
  }

  function localState() {
    try {
      const raw = localStorage.getItem('calcDaily.v2');
      return raw ? JSON.parse(raw) : {};
    } catch {
      return {};
    }
  }

  async function handleSession(session, eventName = '') {
    const user = session?.user || null;

    if (!user) {
      currentSessionUserId = null;
      window.CalcDailyCloud?.setUser?.(null);
      syncStatus = 'idle';
      syncMessage = '';
      setProfileMessage('');
      renderAccountUI();
      return;
    }

    const sameUser =
      currentSessionUserId === user.id;

    currentSessionUserId = user.id;
    window.CalcDailyCloud?.setUser?.(user);

    renderAccountUI();

    // TOKEN_REFRESHED / USER_UPDATED 不重复执行整套迁移。
    if (
      sameUser &&
      [
        'INITIAL_SESSION',
        'BOOTSTRAP',
        'TOKEN_REFRESHED',
        'USER_UPDATED'
      ].includes(eventName)
    ) {
      return;
    }

    try {
      syncStatus = 'loading';
      syncMessage = '正在读取云端学习记录…';
      renderAccountUI();

      const merged =
        await window.CalcDailyCloud.resolveAfterSignIn(
          localState()
        );

      await pushCloudStateToApp(merged);

      syncStatus = 'synced';
      syncMessage = '云端已同步';
      renderAccountUI();

    } catch (error) {
      console.warn('登录后的云端同步失败', error);
      syncStatus = 'error';
      syncMessage =
        error.message || '同步失败';
      renderAccountUI();
    }
  }

  async function submitAuthForm(event) {
    event.preventDefault();

    if (!configured() || authBusy) return;

    const email = String(
      $('authEmailInput')?.value || ''
    ).trim();

    const password = String(
      $('authPasswordInput')?.value || ''
    );

    const nickname = String(
      $('authNicknameInput')?.value || ''
    ).trim();

    if (!email || !password) {
      setMessage('请输入邮箱和密码。', 'error');
      return;
    }

    if (
      authMode === 'register' &&
      !nickname
    ) {
      setMessage('请输入昵称。', 'error');
      return;
    }

    if (
      authMode === 'register' &&
      nickname.length > 20
    ) {
      setMessage('昵称不能超过 20 个字符。', 'error');
      return;
    }

    authBusy = true;

    const submit = $('authSubmitBtn');

    if (submit) {
      submit.disabled = true;
      submit.textContent =
        authMode === 'login'
          ? '登录中…'
          : '注册中…';
    }

    try {
      if (authMode === 'login') {
        const { error } =
          await client().auth.signInWithPassword({
            email,
            password
          });

        if (error) throw error;

        setMessage(
          '登录成功，正在同步学习记录。',
          'success'
        );

      } else {
        const { data, error } =
          await client().auth.signUp({
            email,
            password,
            options: {
              emailRedirectTo:
                `${window.location.origin}/`,
              data: {
                display_name: nickname
              }
            }
          });

        if (error) throw error;

        if (data.session) {
          setMessage(
            '注册成功，正在同步当前学习记录。',
            'success'
          );
        } else {
          setMessage(
            '账号已创建。请按邮箱中的确认链接完成验证，然后回来登录。',
            'success'
          );
        }
      }

    } catch (error) {
      setMessage(
        error.message || '账号操作失败。',
        'error'
      );

    } finally {
      authBusy = false;

      if (submit) {
        submit.disabled = false;
        submit.textContent =
          authMode === 'login'
            ? '登录'
            : '创建账号';
      }
    }
  }

  async function saveNickname() {
    const user = currentUser();

    if (
      !configured() ||
      !user ||
      nicknameBusy
    ) {
      return;
    }

    const nickname = String(
      $('signedInNicknameInput')?.value || ''
    ).trim();

    if (!nickname) {
      setProfileMessage(
        '昵称不能为空。',
        'error'
      );
      return;
    }

    if (nickname.length > 20) {
      setProfileMessage(
        '昵称不能超过 20 个字符。',
        'error'
      );
      return;
    }

    nicknameBusy = true;

    const button = $('saveNicknameBtn');

    if (button) {
      button.disabled = true;
      button.textContent = '保存中…';
    }

    setProfileMessage('');

    try {
      const {
        data,
        error
      } = await client().auth.updateUser({
        data: {
          display_name: nickname
        }
      });

      if (error) throw error;

      const updatedUser =
        data?.user || {
          ...user,
          user_metadata: {
            ...(user.user_metadata || {}),
            display_name: nickname
          }
        };

      const profileResult =
        await client()
          .from('profiles')
          .upsert(
            {
              user_id: updatedUser.id,
              display_name: nickname,
              last_active_at:
                new Date().toISOString()
            },
            {
              onConflict: 'user_id'
            }
          );

      if (profileResult.error) {
        throw profileResult.error;
      }

      window.CalcDailyCloud?.setUser?.(
        updatedUser
      );

      setProfileMessage(
        '昵称已更新。',
        'success'
      );

      renderAccountUI();

    } catch (error) {
      setProfileMessage(
        error.message || '昵称更新失败。',
        'error'
      );

    } finally {
      nicknameBusy = false;

      if (button) {
        button.disabled = false;
        button.textContent = '保存';
      }
    }
  }

  async function syncNow() {
    const user = currentUser();
    if (!user) return;

    const state =
      window.CalcDailyApp?.getState?.() ||
      localState();

    try {
      syncStatus = 'syncing';
      syncMessage = '正在同步学习记录…';
      renderAccountUI();

      await window.CalcDailyCloud?.syncNow?.(
        state,
        { full: true }
      );

      syncStatus = 'synced';
      syncMessage = '云端已同步';
      renderAccountUI();

    } catch (error) {
      syncStatus = 'error';
      syncMessage =
        error.message || '同步失败';
      renderAccountUI();
    }
  }

  async function logout() {
    if (!configured()) return;

    const { error } =
      await client().auth.signOut();

    if (error) {
      setMessage(
        error.message || '退出登录失败。',
        'error'
      );
      return;
    }

    closeModal();
  }

  function bindEvents() {
    $('accountActionBtn')?.addEventListener(
      'click',
      openModal
    );

    $('mobileAccountBtn')?.addEventListener(
      'click',
      openModal
    );

    $('closeAccountModalBtn')?.addEventListener(
      'click',
      closeModal
    );

    $('accountModal')?.addEventListener(
      'click',
      event => {
        if (event.target === $('accountModal')) {
          closeModal();
        }
      }
    );

    document.addEventListener('keydown', event => {
      if (
        event.key === 'Escape' &&
        !$('accountModal')?.classList.contains('hidden')
      ) {
        closeModal();
      }
    });

    $('authLoginTab')?.addEventListener(
      'click',
      () => setMode('login')
    );

    $('authRegisterTab')?.addEventListener(
      'click',
      () => setMode('register')
    );

    $('authForm')?.addEventListener(
      'submit',
      submitAuthForm
    );

    $('saveNicknameBtn')?.addEventListener(
      'click',
      saveNickname
    );

    $('signedInNicknameInput')?.addEventListener(
      'keydown',
      event => {
        if (event.key === 'Enter') {
          event.preventDefault();
          saveNickname();
        }
      }
    );

    $('syncNowBtn')?.addEventListener(
      'click',
      syncNow
    );

    $('logoutBtn')?.addEventListener(
      'click',
      logout
    );

    window.addEventListener(
      'calcdaily:sync-status',
      event => {
        syncStatus =
          event.detail?.status || 'idle';
        syncMessage =
          event.detail?.message || '';
        renderAccountUI();
      }
    );
  }

  async function initAuth() {
    bindEvents();
    setMode('login');
    renderAccountUI();

    if (!configured()) {
      return;
    }

    const {
      data: authListener
    } = client().auth.onAuthStateChange(
      (event, session) => {
        // 避免在 auth callback 内部长期 await。
        setTimeout(() => {
          handleSession(session, event);
        }, 0);
      }
    );

    window.CalcDailyAuth = {
      openModal,
      closeModal,
      unsubscribe() {
        authListener?.subscription?.unsubscribe?.();
      }
    };

    const {
      data,
      error
    } = await client().auth.getSession();

    if (error) {
      console.warn('读取 Supabase Session 失败', error);
      return;
    }

    await handleSession(
      data.session,
      'BOOTSTRAP'
    );
  }

  if (document.readyState === 'loading') {
    document.addEventListener(
      'DOMContentLoaded',
      initAuth
    );
  } else {
    initAuth();
  }
})();
