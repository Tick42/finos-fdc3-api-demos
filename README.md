FDC3 Demo Applications
======================================================

##### Demo applications, part of the demonstration of the demo for FDC3 API and FINOS Interop API implementations.

### Steps to run

0. Prerequisites. Make sure you have:
    - ```npm``` installed
    - [AppD Service Binary](https://stash.tick42.com/projects/FDC/repos/appd-service-binary/browse) installed
    - [FDC3 Toolbar](https://github.com/Tick42/finos-fdc3-appd-toolbar) installed
    - [Eikon](https://eikon.thomsonreuters.com/index.html) installed 
    - [Tick42 artifactory](https://repo.tick42.com/webapp/#/artifacts/browse/simple/General/tick42-npm) setup
1. Download and install the latest [Glue42 Desktop Trial Edition](https://enterprise.glue42.com/install/enterprise/trial/release/GlueInstallerEnterprise.exe?Expires=1555452407&Policy=eyJTdGF0ZW1lbnQiOlt7IlJlc291cmNlIjoiaHR0cHM6Ly9lbnRlcnByaXNlLmdsdWU0Mi5jb20vaW5zdGFsbC9lbnRlcnByaXNlL3RyaWFsL3JlbGVhc2UvR2x1ZUluc3RhbGxlckVudGVycHJpc2UuZXhlIiwiQ29uZGl0aW9uIjp7IkRhdGVMZXNzVGhhbiI6eyJBV1M6RXBvY2hUaW1lIjoxNTU1NDUyNDA3fX19XX0_&Signature=H7iXwEpHoEM3srg45H3T~HFG7-rN73DPhHmEXvzMCHkNVJudsbkrINjzUie~9q6ASRBtxIcg08sEuNgrNLypDW0Y~7uRj8rmFr2fGGZrquB5I2-p1mo3XxDST48cj6TrzfcEsDvEYrQXyDZ9jnC7uy5ehb9CAPJb1hI0~IdrBEJmgv11UluUno~EKdwGRWFDec~BD7azWyfDU2nCJDh2j2mjoouZJ~VzmJqaV33SLeglmDypcxoZ3WAY6T3vCRSkiSOo9Z2GpWIQHe03zwHm0R0AzWbEofwAtw1W5XP7B3AvdTQE5liGATXjzgS6nFFldfLhBY8cEM3erzsHjbzNdQ__&Key-Pair-Id=APKAI7MJZSFJWUJFDJRQ "Download link")
2. Clone https://github.com/Tick42/finos-fdc3-api-demos
3. ```cd fdc3-demo-applications```
4. ```npm i```
5. ```npm run start```

### Demo steps

1. Start AppD Service Binary
2. Start Glue Desktop
3. Start the FDC3 Toolbar

##### Browser demo

1. Inside the Toolbar application choose the Glue42 bus
2. Enable the ```AppD POC Provider``` provider
3. Launch the ```Instrument List Browser``` and ```Instrument Price Chart Browser``` applications
4. From the ```Instrument List Browser``` select an instrument (the ```Instrument Price Chart Browser``` application should get updated)
5. From the ```Instrument List Browser``` open the context menu for an instrument and select ```Instrument Price Chart Browser``` (this will open a new window that will update on raiseIntent)
6. Do the same for the ```Trade Ticket Browser``` application
7. Close all browser windows

##### Glue Desktop

1. Launch the ```Glue42 Instrument List``` and ```Glue42 Instrument Price Chart``` applications
2. Follow the same steps as above (with the Glue42 applications)
3. Do not close the ```Glue42 Instrument List``` and ```Glue42 Instrument Price Chart``` applications
