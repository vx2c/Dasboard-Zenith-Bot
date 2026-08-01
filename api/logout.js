/**
 * /api/logout
 * Clears the session cookie and redirects to the login page.
 */

module.exports = (req, res) => {
  res.setHeader('Set-Cookie',
    'rz_session=; Path=/; HttpOnly; SameSite=Lax; Max-Age=0'
  );
  res.redirect('/');
};
