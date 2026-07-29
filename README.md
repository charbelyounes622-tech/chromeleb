# Chrome Leb — Netlify deployment

This is a Netlify-ready version of the Chrome Leb storefront. The four supplied product photos are copied unchanged and use full-frame presentation without cropping.

## Deploy it yourself

1. Create a GitHub repository and upload the contents of this `netlify-ready` folder (not the parent folder).
2. In Netlify, select **Add new project** and import that repository.
3. Leave the project base directory blank.
4. Build command: `npm run build`.
5. Publish directory: `out`.
6. Deploy. Netlify Blobs is provisioned automatically and securely stores cash-on-delivery orders.

## Enable the owner dashboard

1. In the Netlify project, open **Project configuration → Identity** and select **Enable Identity**.
2. Set registration to **Invite only**.
3. Invite `charbelyounes622@gmail.com` and set a password through the invitation email.
4. In the Identity user details, assign the role `admin`.
5. Visit `/admin`, sign in with that invited Identity account, and view sales.

The order endpoint recalculates the $16 price and the $5/free-on-three delivery rule on the server. The public site remains cash on delivery only.
