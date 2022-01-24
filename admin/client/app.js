var app = new Vue({
  el: '#app',
  data: {
    plaidEnv: 'Loading',
    accounts: [],
  },
  mounted() {
    fetch('admin/accounts')
      .then(resp => resp.json())
      .then(data => (this.accounts = data))

    fetch('admin/plaidEnv')
      .then(resp => resp.json())
      .then(data => (this.plaidEnv = data.env))
  },
  methods: {
    updatePlaidAccessToken: (account, newToken) => {
      if (confirm("Are you sure you want to update this token?")) {
        fetch('admin/setPlaidAccessToken', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            accountId: account.accountId,
            plaidAccessToken: newToken,
          })
        })
      }
    },
    testPlaidApi: (account) => {
      fetch('admin/testPlaidApiConnection', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ accountId: account.accountId })
      }).then((resp) => {
        if (resp.status < 300) {
          alert('Connection Successful. Plaid is ready')
        } else {
          resp.json().then((data) => {
            console.log('-------- Plaid Test Connection Failure --------');
            console.log(JSON.stringify(data, null, 2))
          })

          alert('Plaid connection failure, check console for log');
        }
      })
    },
    syncTransactions: (account) => {
      fetch('admin/syncTransactions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          accountId: account.accountId,
          year: new Date().getFullYear(),
          month: new Date().getMonth() + 1,
        })
      })
    }
  }
})