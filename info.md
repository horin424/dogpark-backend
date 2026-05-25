[Project Overview]
■ Background
We are currently developing a web service (MVP) designed to visualize user status and posts within specific locations.
The frontend (built with Next.js) is largely complete and is currently in a basic working state; however, the backend infrastructure—specifically regarding data storage and the sharing of user status between users—remains undeveloped.
Therefore, we are seeking a developer to help us bring the application to a "minimally usable state."

Our priority is speed; our immediate goal is to reach a state where the application can be utilized for user validation (POC).

---

■ Scope of Work
・Modification of existing Next.js (App Router) code and implementation of new features
・Construction of a simple backend using either Firebase or Supabase
・Implementation of data storage processes for posts and user status
・Partial migration of data storage away from `localStorage`
・Testing and basic release support

## _Note: Full-scale architectural design or advanced scalability is not required (an MVP-level solution is sufficient)._

■ Additional Notes
・Since existing code is already in place, this project does not involve development from scratch.
・Depending on the outcome of this project, we may discuss opportunities for ongoing maintenance and further development work.

For the current MVP, real-time functionality is not a strict requirement.

Our primary focus is on reaching a state where user validation can be conducted effectively; therefore, a latency of a few to several tens of seconds is acceptable.
Consequently, for the initial implementation, we intend to prioritize the simplest possible architecture—such as a polling-based approach—to the greatest extent possible.

In the future—once usage patterns and specific needs become clearer—we can certainly consider migrating to solutions like Firestore's real-time listeners should real-time updates prove necessary.

In terms of current priorities, we place greater emphasis on "achieving a stable state for validation as quickly as possible" than on "real-time responsiveness."

I have a quick question regarding this service: Is it absolutely essential that "user state sharing" operates in real-time? Or would a design that allows for a latency of a few to several tens of seconds be acceptable?
Clarifying this point will allow us to optimize our design strategy—specifically, whether to base the architecture on Firestore's real-time listeners or to build it more simply using a polling-based approach.

For this project, our goal is to proceed to user validation as quickly as possible; therefore, we wish to prioritize building a "Minimum Viable Product (MVP) that works in the shortest timeframe."

With that premise in mind, I would like to confirm the following points:

・Items we are intentionally excluding (out of scope)
・Our vision for the implementation using a minimum configuration
・Whether it is possible to shorten the delivery timeline (as we aim to release the initial version as soon as possible)

------confirmation from client :

■ What We Are Intentionally Omitting (Out of Scope)
To maximize initial velocity, the following items are intentionally placed out of scope:
・Complex permission management / Role design
・Optimizations for scalability (e.g., index optimization, load balancing)
・Advanced UI/UX improvements (priority is placed on basic functionality first)
・Detailed logging design or the construction of an analytics infrastructure
・Comprehensive error handling or exhaustive testing

Our sole focus is on reaching a state where "users can actually use the product and validate it."

■ Implementation Vision: Minimum Viable Configuration
For the MVP, we envision the following simple configuration:

・Authentication: Firebase Auth or Supabase Auth (Anonymous or Simple Login)
・Data:

- `users` (Minimum identification information)
- `posts` (Post data)
- `states` (User status/state)
  ・Processing Logic:
- Saving / Retrieving posts
- Updating / Sharing user status
  ・Frontend:
- Gradually replacing parts dependent on `localStorage` with server-side integration
- Implementing simple real-time updates (or lightweight polling) as needed

We will narrow our focus to a "minimum viable configuration that functions without breaking," avoiding the introduction of any unnecessary layers.

■ Regarding Shortening the Delivery Timeline
This is certainly possible.
We will start by isolating an "Initial Version (Core Features Only)" and aim to release it as quickly as possible.

As a rough guideline:
・Initial Version (Basic functionality for posting + status sharing): Approx. a few days to one week
・Minor adjustments and improvements: Handled on an ongoing basis thereafter

We will proceed in a manner that allows for parallel adjustments to be made while implementation is underway.

■ Proceeding with the Expectation of Specification Changes
This poses no problem; in fact, we consider this to be a fundamental premise for an MVP.

Therefore, we will implement with a conscious focus on:
・Designs with a limited scope of impact (Loose Coupling)
・Data structures that are easy to modify later

Unless a major directional shift is required, we can accommodate such changes without slowing down our pace.
