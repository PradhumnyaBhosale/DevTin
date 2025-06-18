#include<bits/stdc++.h>
using namespace std;
#define int long long
const int MOD = 1e9+7 ;
const int INF = LLONG_MAX / 2 ;
signed main()
{ 

 int n;
cin >> n ;

while(n--){
   
    int n,k;
    cin>>n>>k;
    vector<int> a(n);
    for(int i = 0; i < n; i++) {
        cin >> a[i];
    }
    if(n == 1) {
        cout << a[0] << endl;
        
    }
    else
    {
        cout<<abs(n-k)<<endl;
    }

}
return 0 ;
}