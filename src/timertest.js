var called = 0;

function infiniteTimerGame(callback) {
  console.log('in func');
  return new Promise((resolve, reject) => {
      console.log('in promise');
      // process.nextTick(() => {
      //     console.log('nexttick1');
          
      //         jest.runAllTimers();
      //   }); 
      Promise.resolve({})
      .then(_ => {
        resolve({});
        console.log('inner resolve()');
        
        // Schedule the next game in 10 seconds
        setTimeout(() => {
          console.log('in timeout');
          infiniteTimerGame(callback);
          //process.nextTick(() => {
          //  console.log('nextick timeout');
            //jest.runAllTimers(); 
         // });
        }, 1);

    
      })
        // process.nextTick(() => {
        //   console.log('nexttick');
          
        //   jest.runAllTimers();
        //   process.nextTick(() => {
        //     console.log('nexttick nested');
        //     jest.runAllTimers();
        //   })
        // });  
  });
  }

module.exports = infiniteTimerGame;