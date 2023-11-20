
![Url shortner architecture](https://github.com/sushruth-06/URL-Shortener-App/assets/44200208/87512719-c0cf-40f8-b492-4496e0e209e3)

## SCALABLE, FAULT TOLERANT, EFFECIENT AND ZERO COLLISIONS 

The ones listed above are the main features of the app which is essential for a URL shortener service. Every component is designed to adhere to the above features. The design choice and reasoning for the same is listed below:

### DB Design:
- The two choices were RDBMS and NoSQL. NoSQL was chosen as there is not a lot of relationships in our data and NoSQL is faster for writing and simple key-value reads.
- The MAIN advantage of NoSQL is its ease to scale by adding more servers to a distributed system hence I have used MongoDB Atlas it would also overcome single point of failure.
I have used 3 schemas defined below:
```

url schema: { longUrl: Any URL that user defines,
                shortUrl: This is a URL that the server will generate which is made up of [0-9],[a-z],[A-Z],
                user: UserID,
                creationDate: Creation timestamp
              }
user schema: {userID: Unique ID for each user,
                tier: Tier the user belongs to (default to tier 3),
                requests: Number of requests user has made}
tier schema: {1:5000 requests limit,
               2:1000,
               3:100,
               4:5
               }

```



### Short URL generation:
- We could generate a random URL and try to insert it to the DB using the putIfAbsent clause, but this may result in a lot of collisions. Additionally, we could use a MD5 or SHA256 algorithm to generate a unique value but as the size of hashed output is more than 7, we would have to use only the first 7 or 8 characters which would again lead to collisions.
- If we use 7 a short URL of 7 chars using base 62 we have about 3.5 Trillion unique short URLs we could generate.
- Instead, we could maintain a counter, which we would pass to a base62 encoder that would result in a unique value every time we generate a short URL resulting in zero collisions.

### ZooKeeper:
- To overcome a single point of failure and maintain the counter across all servers we use the Apache ZooKeeper which is a highly reliable distributed coordinator.
- ZooKeeper maintains ranges of unused counters. When servers are added these servers will ask for the unused range from Zookeepers. In the worst case, if one of the servers goes down then only that range of data is affected. We can replicate data of master to its slave and while we try to bring master back, we can divert read queries to its slaves.

### REST Endpoints:
- An endpoint that takes in a long URL and returns a shortened one:
  - POST http://localhost:3000/urls  
        Content-Type: application/json  
        ```
        {
            "longUrl":"(https://www.youtube.com/watch?v=F2hVTkL6bNM)",
            "user":2
        }
        ```  
        or if user want a custom short url the below can be used  
        ```
        {
            "longUrl":"(https://www.youtube.com/watch?v=F2hVTkL6bNM)",
            "shortUrl": "customUrl"
            "user":4
        }
        ```
- An endpoint that returns a history of all URLs shortened by a given user:
  - GET http://localhost:3000/urls/history/:id
    
- The short urls redirect to their long url counterparts:
  - GET http://localhost:3000/urls/customUrl





