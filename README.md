# Listed For You

A static, GitHub Pages-ready website for a no-sale-no-fee resale concierge business.

## Files

- `index.html` - page structure and content
- `styles.css` - responsive blue visual design
- `script.js` - mobile navigation, item form, photo previews and demo submission handling

## Hosting on GitHub Pages

1. Create a new GitHub repository.
2. Upload these files to the repository root.
3. Go to **Settings > Pages**.
4. Choose **Deploy from a branch**.
5. Select `main` and `/root`.
6. Save.

## Connecting the request form

GitHub Pages is static, so it cannot store form submissions or uploaded photos by itself.

In `script.js`, replace:

```js
formEndpoint: ""
```

with an endpoint from a form or backend service, such as Formspree, Basin, Tally, Supabase, Firebase or your own API.

Until an endpoint is added, the form runs in demo mode. It previews selected photos, stores the latest submission in the browser, and opens an email draft with the request details.

## Details to customise

- Business email and phone number
- Service area
- Final commission structure
- Whether pickup/delivery is offered
- Business ABN and legal terms
- Form backend endpoint
