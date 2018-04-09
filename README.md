[Cozy][cozy] Pajemploi
======================

What's Cozy?
------------

![Cozy Logo](https://cdn.rawgit.com/cozy/cozy-guidelines/master/templates/cozy_logo_small.svg)

[Cozy] is a platform that brings all your web services in the same private space. With it, your webapps and your devices can share data easily, providing you with a new experience. You can install Cozy on your own hardware where no one's tracking you.

What's this konnector?
----------------------

This konnector gets information from [Pajemploi][pajemploi], a service provided
by the French [URSSAF][urssaf] to childminders and people employing them.

What data is imported?
----------------------

For employers, the konnector imports the payslips of their childminder(s).

In the future, it should also:
- import the payslips for childminders
- import relevant metadata to allow the Banks application to link bank
  operations to the payslips.

### Open a Pull-Request

If you want to work on this konnector and submit code modifications, feel free to open pull-requests! See the [contributing guide][contribute] for more information about how to properly open pull-requests.

### Cozy-konnector-libs

This connector uses [cozy-konnector-libs](https://github.com/cozy/cozy-konnector-libs). You can find more documentation about it there.

### Maintainer

The lead maintainer for this konnector is @sebn


### Get in touch

You can reach the Cozy Community by:

- Chatting with us on IRC [#cozycloud on Freenode][freenode]
- Posting on our [Forum]
- Posting issues on the [Github repos][github]
- Say Hi! on [Twitter]


License
-------

Pajemploi konnector is developed by sebn and distributed under the [AGPL v3 license][agpl-3.0].

[cozy]: https://cozy.io "Cozy Cloud"
[pajemploi]: http://www.pajemploi.urssaf.fr
[urssaf]: https://en.wikipedia.org/wiki/URSSAF
[agpl-3.0]: https://www.gnu.org/licenses/agpl-3.0.html
[freenode]: http://webchat.freenode.net/?randomnick=1&channels=%23cozycloud&uio=d4
[forum]: https://forum.cozy.io/
[github]: https://github.com/cozy/
[nodejs]: https://nodejs.org/
[standard]: https://standardjs.com
[twitter]: https://twitter.com/mycozycloud
[webpack]: https://webpack.js.org
[yarn]: https://yarnpkg.com
[travis]: https://travis-ci.org
[contribute]: CONTRIBUTING.md
