---
sidebar_position: 0
title: Overview
slug: /
---

# _@skyleague/salesforce-streaming-sdk_

This _independent_ TypeScript SDK provides CometD clients for the [Salesforce Streaming API](https://developer.salesforce.com/docs/atlas.en-us.api_streaming.meta/api_streaming/intro_stream.htm) based on the published documentation.

When working with both Salesforce and AWS, there are many ways to integrate the two platforms. One common method involves using custom Apex code on the Salesforce platform to make outgoing API calls or leveraging the sObject API to update objects from AWS. These techniques work well for synchronous updates between the two platforms. However, in certain situations, it may be more effective to use event-driven architectures. By leveraging events, the integration between Salesforce and AWS can be designed to be more loosely coupled and resilient, allowing for asynchronous communication and reducing the risk of downtime or data loss.

[Salesforce Streaming API](https://developer.salesforce.com/docs/atlas.en-us.api_streaming.meta/api_streaming/intro_stream.htm) and [AWS AppFlow](https://docs.aws.amazon.com/appflow/latest/userguide/salesforce.html) are both powerful tools for exchanging Platform Events between Salesforce and AWS, but they serve different purposes and have different strengths.

The Salesforce Streaming API is a real-time push-based API that allows you to receive updates from Salesforce in real-time. It provides a scalable solution for subscribing to changes in Salesforce data, including Platform Events. The Streaming API is especially useful when you need to react to events as they happen, such as updating a dashboard or triggering a business process in response to a customer action.

On the other hand, AWS AppFlow is a tool for integrating data between Salesforce and external systems. It provides a simple, no-code way to move data between Salesforce and external systems, including events generated by Platform Events. AWS AppFlow is useful when you need to transfer data between Salesforce and other systems on a scheduled basis or trigger a flow based on a Platform Event.

## Why should I choose the Salesforce Streaming API?

The Salesforce Streaming API includes several replay options that allow subscribers to recover missed events and continue to receive updates from where they left off:

-   Replay All: This option provides all events, including those that have already been delivered to other clients. This option is useful when you need a complete history of events.
-   Replay ID: This option allows you to specify the starting event ID to replay from. This is useful when you need to recover missed events after a specific point.
-   Replay Latest: This option provides only the most recent event, allowing you to catch up on any events that you missed.
-   Replay Time: This option allows you to specify a time range to replay events from. This is useful when you need to recover events that were missed during a specific period.

These replay options provide flexibility and reliability for subscribers who need to recover missed events or continue to receive updates from where they left off. By using these options, subscribers can ensure that they receive all the events they need, even if they experienced a temporary loss of connectivity or if they joined the stream after it had already started.

The Streaming API can offer more flexibility to subscribers in handling failures because the application code can handle the failure. On the other hand, with AppFlow, a failure can result in the disabling of the flow related to the AppFlow event. Custom monitoring is needed to account for failures in AppFlow, and scheduled or manual restarts of the flow are required with no option to specify the starting point. Therefore, Streaming API may be a better option when subscribers require greater control over handling failures, while AppFlow may be more suitable for use cases where failures are less critical and require minimal manual intervention.

## Features

The SDK offers two levels of abstraction for integrating with SalesForce: the `SalesforceStreamingObservable` and the `SalesforceStreaming` clients. The credentials (Bearer token) required for usage of this SDK are the same as you would use for the sObject API.

-   The `SalesforceStreamingObservable` client is a low-level wrapper that configures all the options on the CometD client for use with the Salesforce Streaming API. It provides fine-grained control over the client's lifecycle, as well as execution of message callback handlers outside of the main loop. This level of abstraction is suitable for use within a containerized application, where low-level control is important, and the listener can potentially listen for events indefinitely.

-   The `SalesforceStreaming` client is an abstraction layer built on top of `SalesforceStreamingObservable`, tailored specifically for use within AWS Lambda Functions. It simplifies the management of the client's lifecycle, taking into account the constraints imposed by AWS Lambda Function executions, such as the time limit imposed on the execution. This level of abstraction is ideal for organizations that want to quickly integrate with SalesForce within their AWS Lambda Function code.

## Installation

Install the Salesforce Streaming SDK using [`npm`](https://www.npmjs.com/):

```console
 $ npm install @skyleague/salesforce-streaming-sdk
```

## Example usage

```ts
import { SalesforceStreaming } from '@skyleague/salesforce-streaming-sdk'

export async function handler(event, context) {
    const client = new SalesforceStreaming({
        baseUrl: 'https://MYDOMAINNAME--SANDBOXNAME.sandbox.my.salesforce.com',
        bearer: async () => await getToken(),
        streamingApiPath: '/cometd/56.0',
    })

    for await (const message of client.subscribePlatformEvent({
        eventType: 'myEvent__e',
        // make sure the Lambda Timeout is not exceeded
        timeout: 300,
        // use some replayId from past executions instead of 'all'
        replayId: 'all',
    })) {
        // do something with the data
        console.log(message.data)
    }
}
```

## Alternative projects

In no particular order, the following libraries try to solve similar problems (albeit very different):

-   [`CometD`](https://github.com/cometd/cometd/); This SDK uses the CometD transport definition that is also used by Salesforce. While the protocol itself is relatively simple, this SDK has been designed with insights gained from past implementations to simplify interaction with the CometD protocol for Salesforce.

PR's are very welcome if you think your project is missing here.

## Support

SkyLeague provides Enterprise Support on this open-source library package at clients across industries. Please get in touch via [`https://skyleague.io`](https://skyleague.io).

If you are not under Enterprise Support, feel free to raise an issue and we'll take a look at it on a best-effort basis!

## License & Copyright

This library is licensed under the MIT License (see [LICENSE.md](./LICENSE.md) for details).

If you using this SDK without Enterprise Support, please note this (partial) MIT license clause:

> THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND

Copyright (c) 2022, SkyLeague Technologies B.V.. 'SkyLeague' and the astronaut logo are trademarks of SkyLeague Technologies, registered at Chamber of Commerce in The Netherlands under number 86650564.

All product names, logos, brands, trademarks and registered trademarks are property of their respective owners. All company, product and service names used in this website are for identification purposes only. Use of these names, trademarks and brands does not imply endorsement.
