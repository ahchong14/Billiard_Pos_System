const translations = {
  zh: {
    login: '登录',
    dashboard: '桌位地图',
    checkout: '结算'
  },
  en: {
    login: 'Login',
    dashboard: 'Dashboard',
    checkout: 'Checkout'
  }
}

export function t(lang='zh', key){
  return (translations[lang] && translations[lang][key]) || translations['zh'][key] || key
}

export default translations
